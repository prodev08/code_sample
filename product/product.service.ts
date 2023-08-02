import * as ngCommonHttp from '@angular/common/http';

import { Injectable } from '@angular/core';
import { ProductGroup, ProductGroupsResponse } from '@interfaces/product-group/1.0';
import {
  ModifierGroupOverride,
  Product,
  ProductOverrideInput,
  ProductsResponse,
} from '@interfaces/product/1.0';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';

import { AbstractProductService } from '@abstract-services/product/1.0/product.abstract-service';
import { ProductsAPI } from '@constants/api';
import { CatalogItemType } from '@constants/catalogItem/1.0';
import { CatalogItemsService } from '@services/catalog-items/1.0/catalog-items.service';
import { PaginationService } from '@services/pagination/1.0/pagination.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService extends AbstractProductService {
  productsApiUrl;
  productPutApiUrl;
  productGroupsByProductGetApiUrl;
  itemType = CatalogItemType.PRODUCT;

  // save the list of products after fetching but keep track of which brand this is for so we can reset it
  cachedBrandId: string;
  fetchReplay: Observable<Product[]>;

  constructor(
    private http: ngCommonHttp.HttpClient,
    private paginationService: PaginationService,
    private catalogItemsService: CatalogItemsService,
  ) {
    super();
    this.productsApiUrl = ProductsAPI.GET;
    this.productPutApiUrl = ProductsAPI.PUT;
    this.productGroupsByProductGetApiUrl = ProductsAPI.GET_BY_PRODUCT;
  }

  getProducts(brandId: string): Observable<Product[]> {
    // reset cache if this is a different brand ID
    if (this.cachedBrandId !== brandId) {
      this.catalogItemsService.resetMasterCache();
      this.cachedBrandId = brandId;
      this.fetchReplay = undefined;
    }
    if (!this.catalogItemsService.getCache(this.itemType)) {
      this.catalogItemsService.updateCache(this.itemType);
      const url = this.productsApiUrl.replace(':tenantId', brandId);
      return (this.fetchReplay = this.paginationService.fetchAllPages<ProductsResponse>(url).pipe(
        map((response: ProductsResponse) => {
          if (response && response._embedded) {
            for (const item of response._embedded.products) {
              if (item.images) {
                delete item.images;
              }
            }
            return response._embedded.products;
          } else {
            return undefined;
          }
        }),
        tap((values: Product[]) => {
          if (values) {
            this.catalogItemsService.updateCache(this.itemType, values);
          }
        }),
        shareReplay(1), // use shareReplay so it will retry if there is an error unlike publishReplay
        catchError((err: ngCommonHttp.HttpErrorResponse) => {
          this.catalogItemsService.clearCache(this.itemType);
          return throwError(err);
        }),
      ));
    } else if (this.catalogItemsService.getCache(this.itemType).length === 0) {
      return this.fetchReplay;
    } else {
      return of(this.catalogItemsService.getCache(this.itemType));
    }
  }

  /**
   * Get Product Groups by Product catalogEntryId
   *
   * @param catalogEntryId - id of Product
   */
  getProductGroupsByProduct(catalogEntryId: string): Observable<ProductGroup[]> {
    const url = this.productGroupsByProductGetApiUrl.replace(':catalogEntryId', catalogEntryId);
    return this.http.get(url).pipe(
      map((response: ProductGroupsResponse) => {
        if (response && response._embedded) {
          return response._embedded.productGroups;
        } else {
          return undefined;
        }
      }),
      catchError((err: ngCommonHttp.HttpErrorResponse) => {
        return throwError(err);
      }),
    );
  }

  /**
   * create
   *
   * @param product [Partial<Product>] single Product
   * @returns observable of current single Product
   */
  create(product: Partial<Product>, brandId: string): Observable<Product> {
    const BODY = { ...product };
    if (!BODY.modifierGroupIds) {
      BODY.modifierGroupIds = [];
    }

    const url = this.productsApiUrl.replace(':tenantId', brandId);
    return this.http.post(url, BODY).pipe(
      map((response: Product) => {
        return response;
      }),
      tap((p: Product) => {
        if (this.cachedBrandId === brandId && this.catalogItemsService.getCache(this.itemType)) {
          this.catalogItemsService.addItemCache(p, this.itemType);
        }
      }),
      catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
    );
  }

  save(catalogEntryId: string, product: Product): Observable<any> {
    const url = `${this.productPutApiUrl}${catalogEntryId}`;
    return this.http.put(url, product).pipe(
      map((response: Product) => {
        return response;
      }),
      tap((p: Product) => {
        this.catalogItemsService.updateItemCache(p, this.itemType);
      }),
      catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
    );
  }

  saveOverrides(catalogEntryId: string, overrides: ModifierGroupOverride[]): Observable<Product> {
    const url = `${this.productPutApiUrl}${catalogEntryId}/overrides`;
    const BODY: ProductOverrideInput = {
      payload: overrides,
    };
    return this.http.put(url, BODY).pipe(
      map((response: Product) => {
        return response;
      }),
      tap((p: Product) => {
        this.catalogItemsService.updateItemCache(p, this.itemType);
      }),
      catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
    );
  }
}
