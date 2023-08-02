import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { getTestBed, TestBed } from '@angular/core/testing';
import { DefaultUrlSerializer, UrlSerializer } from '@angular/router';
import { Modifier } from '@interfaces/modifier/1.0';
import { ProductGroup } from '@interfaces/product-group/1.0';
import { Product } from '@interfaces/product/1.0';
import { CatalogItemsService } from '@services/catalog-items/1.0/catalog-items.service';
import { PaginationService } from '@services/pagination/1.0/pagination.service';
import { ProductService } from './product.service';

const MOCK_PRODUCTS: Product[] = [
  {
    catalogEntryId: '11111',
    title: 'Smashburger',
    description: 'Original Smashburger',
    name: 'Smashburger',
    modifierGroupIds: [],
  },
  {
    catalogEntryId: '22222',
    title: 'CYO Big Smash',
    description: 'Create your own Big Smashburger',
    name: 'CYO Big Smash',
    modifierGroupIds: [],
  },
  {
    catalogEntryId: '33333',
    title: 'Shocker Grilled Chicken',
    description: '',
    name: 'Shocker Grilled Chicken',
    modifierGroupIds: [],
  },
  {
    catalogEntryId: '44444',
    title: '',
    description: '',
    name: 'Chocolate Shake',
    modifierGroupIds: [],
  },
];

const MOCK_CACHED_PRODUCTS: Product[] = [
  {
    catalogEntryId: '11111',
    title: 'Smashburger',
    description: 'Original Smashburger',
    name: 'Smashburger',
    modifierGroupIds: [],
  },
  {
    catalogEntryId: '22222',
    title: 'CYO Big Smash',
    description: 'Create your own Big Smashburger',
    name: 'CYO Big Smash',
    modifierGroupIds: [],
  },
  {
    catalogEntryId: '33333',
    title: 'Shocker Grilled Chicken',
    description: '',
    name: 'Shocker Grilled Chicken',
    modifierGroupIds: [],
  },
  {
    catalogEntryId: '44444',
    title: '',
    description: '',
    name: 'Chocolate Shake',
    modifierGroupIds: [],
  },
];

const MOCK_PRODUCT_GROUPS: ProductGroup[] = [
  {
    catalogEntryId: '789002',
    title: 'Burgers',
    name: 'Burgers',
    description: 'Burgers',
    minimumQuantity: 0,
    maximumQuantity: 10,
    productIds: [],
  },
  {
    catalogEntryId: '789003',
    title: 'Desserts',
    name: 'Desserts',
    description: 'Desserts',
    minimumQuantity: 1,
    maximumQuantity: 3,
    productIds: ['12', '13'],
  },
];

const MOCK_PRODUCT: Product = {
  title: 'New Product',
  description: 'description',
  name: 'New Product',
  modifierGroupIds: [],
};
const BRAND_ID = '12345';

describe('ProductService', () => {
  let injector: TestBed;
  let service: ProductService;
  let httpMock: HttpTestingController;
  let catalogItemsService: CatalogItemsService;
  let itemType;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductService,
        CatalogItemsService,
        { provide: UrlSerializer, useClass: DefaultUrlSerializer },
        { provide: PaginationService, useClass: PaginationService },
      ],
      imports: [HttpClientTestingModule],
    });

    injector = getTestBed();
    service = injector.inject(ProductService);
    catalogItemsService = injector.inject(CatalogItemsService);
    httpMock = injector.inject(HttpTestingController);
    itemType = service.itemType;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('create works', (done) => {
    service.create(MOCK_PRODUCT, BRAND_ID).subscribe((product: Product) => {
      done();
    });

    const URL = service.productsApiUrl.replace(':tenantId', BRAND_ID);
    const mockRequest = httpMock.expectOne(URL);
    expect(mockRequest.request.method).toBe('POST');
    expect(mockRequest.request.body).toEqual(MOCK_PRODUCT);
    mockRequest.flush(MOCK_PRODUCT);
  });

  it('create error handled', (done) => {
    service.create(MOCK_PRODUCT, BRAND_ID).subscribe({
      error: (error) => {
        expect(error).toBeTruthy();
        done();
      },
    });

    const URL = service.productsApiUrl.replace(':tenantId', BRAND_ID);
    const mockRequest = httpMock.expectOne(URL);
    expect(mockRequest.request.method).toBe('POST');
    mockRequest.flush('error', { status: 500, statusText: 'Internal error' });
  });

  it('create sets modifierGroupIds if undefined', (done) => {
    const MOCK = { ...MOCK_PRODUCT };
    delete MOCK.modifierGroupIds;
    service.create(MOCK, BRAND_ID).subscribe((product: Product) => {
      done();
    });

    const URL = service.productsApiUrl.replace(':tenantId', BRAND_ID);
    const mockRequest = httpMock.expectOne(URL);
    expect(mockRequest.request.method).toBe('POST');
    expect(mockRequest.request.body).toEqual(MOCK_PRODUCT);
    mockRequest.flush(MOCK_PRODUCT);
  });

  it('getProducts gets an observable Products list', (done) => {
    const list = MOCK_PRODUCTS;
    service.getProducts(BRAND_ID).subscribe((products: Product[]) => {
      expect(products).toEqual(list);
      done();
    });
    const URL = service.productsApiUrl.replace(':tenantId', BRAND_ID);

    const mockRequests = httpMock.match((req) => {
      return req.urlWithParams === `${URL}?size=100`;
    });
    expect(mockRequests.length).toBe(1);
    mockRequests.forEach((m) => {
      expect(m.request.method).toBe('GET');
      m.flush({ _embedded: { products: list } });
    });
  });

  it('getProducts gets undefined for malformed data', (done) => {
    const list = MOCK_PRODUCTS;
    service.getProducts(BRAND_ID).subscribe((mods: Modifier[]) => {
      expect(mods).toEqual(undefined);
      done();
    });
    const URL = service.productsApiUrl.replace(':tenantId', BRAND_ID);

    const mockRequests = httpMock.match((req) => {
      return req.urlWithParams === `${URL}?size=100`;
    });
    expect(mockRequests.length).toBe(1);
    mockRequests.forEach((m) => {
      expect(m.request.method).toBe('GET');
      m.flush({ BAD: list });
    });
  });

  it('getProducts handles error', (done) => {
    const list = MOCK_PRODUCTS;
    service.getProducts(BRAND_ID).subscribe({
      error: (error) => {
        expect(error).toBeTruthy();
        done();
      },
    });
    const URL = service.productsApiUrl.replace(':tenantId', BRAND_ID);

    const mockRequests = httpMock.match((req) => {
      return req.urlWithParams === `${URL}?size=100`;
    });
    expect(mockRequests.length).toBe(1);
    mockRequests.forEach((m) => {
      expect(m.request.method).toBe('GET');
      m.flush('error', { status: 500, statusText: 'Internal error' });
    });
  });

  it('getProductGroupsByProduct gets an observable ProductGroup list', (done) => {
    const list = MOCK_PRODUCT_GROUPS;
    const ID = '23432';
    service.getProductGroupsByProduct(ID).subscribe((products: ProductGroup[]) => {
      expect(products).toEqual(list);
      done();
    });
    const URL = service.productGroupsByProductGetApiUrl.replace(':catalogEntryId', ID);

    const mockRequest = httpMock.expectOne(URL);
    expect(mockRequest.request.method).toBe('GET');
    mockRequest.flush({ _embedded: { productGroups: list } });
  });

  it('getProductGroupsByProduct gets undefined for malformed data', (done) => {
    const list = MOCK_PRODUCT_GROUPS;
    const ID = '23432';
    service.getProductGroupsByProduct(ID).subscribe((p: ProductGroup[]) => {
      expect(p).toBeUndefined();
      done();
    });
    const URL = service.productGroupsByProductGetApiUrl.replace(':catalogEntryId', ID);

    const mockRequest = httpMock.expectOne(URL);
    expect(mockRequest.request.method).toBe('GET');
    mockRequest.flush({ BAD: { productGroups: list } });
  });

  it('getProductGroupsByProduct handles error', (done) => {
    const ID = '23432';
    service.getProductGroupsByProduct(ID).subscribe({
      error: (error) => {
        expect(error).toBeTruthy();
        done();
      },
    });
    const URL = service.productGroupsByProductGetApiUrl.replace(':catalogEntryId', ID);

    const mockRequest = httpMock.expectOne(URL);
    expect(mockRequest.request.method).toBe('GET');
    mockRequest.flush('error', { status: 500, statusText: 'Internal error' });
  });

  it('save works', (done) => {
    const ID = '1234555';
    service.save(ID, MOCK_PRODUCT).subscribe(() => {
      done();
    });
    const url = `${service.productPutApiUrl}${ID}`;
    const mockRequest = httpMock.expectOne(url);
    expect(mockRequest.request.method).toBe('PUT');
    mockRequest.flush(MOCK_PRODUCT);
  });

  it('saves handles error', (done) => {
    const ID = '1234555';
    service.save(ID, MOCK_PRODUCT).subscribe({
      error: (error) => {
        expect(error).toBeTruthy();
        done();
      },
    });
    const url = `${service.productPutApiUrl}${ID}`;
    const mockRequest = httpMock.expectOne(url);
    expect(mockRequest.request.method).toBe('PUT');
    mockRequest.flush('error', { status: 500, statusText: 'Internal error' });
  });

  it('saveOverrides works', (done) => {
    const ID = '1234555';
    const OVERRIDES = [
      {
        modifierGroupId: 'mg1',
        allowedModifications: [
          {
            modifierId: 'm1',
            instructionIds: ['i1', 'i2'],
          },
        ],
        defaultModifications: [
          {
            modifierId: 'm1',
            instructionIds: [],
          },
        ],
        modifierQuantities: [],
      },
      {
        modifierGroupId: 'mg2',
        allowedModifications: [
          {
            modifierId: 'm2',
            instructionIds: ['i1', 'i2', 'i3'],
          },
        ],
        defaultModifications: [
          {
            modifierId: 'm2',
            instructionIds: ['i1'],
          },
        ],
        modifierQuantities: [],
      },
    ];

    service.saveOverrides(ID, OVERRIDES).subscribe(() => {
      done();
    });
    const url = `${service.productPutApiUrl}${ID}/overrides`;
    const mockRequest = httpMock.expectOne(url);
    expect(mockRequest.request.method).toBe('PUT');
    mockRequest.flush(MOCK_PRODUCT);
  });

  it('saveOverrides handles error', (done) => {
    const ID = '1234555';
    const OVERRIDES = [
      {
        modifierGroupId: 'mg1',
        allowedModifications: [
          {
            modifierId: 'm1',
            instructionIds: ['i1', 'i2'],
          },
        ],
        defaultModifications: [
          {
            modifierId: 'm1',
            instructionIds: [],
          },
        ],
        modifierQuantities: [],
      },
      {
        modifierGroupId: 'mg2',
        allowedModifications: [
          {
            modifierId: 'm2',
            instructionIds: ['i1', 'i2', 'i3'],
          },
        ],
        defaultModifications: [
          {
            modifierId: 'm2',
            instructionIds: ['i1'],
          },
        ],
        modifierQuantities: [],
      },
    ];
    service.saveOverrides(ID, OVERRIDES).subscribe({
      error: (error) => {
        expect(error).toBeTruthy();
        done();
      },
    });
    const url = `${service.productPutApiUrl}${ID}/overrides`;
    const mockRequest = httpMock.expectOne(url);
    expect(mockRequest.request.method).toBe('PUT');
    mockRequest.flush('error', { status: 500, statusText: 'Internal error' });
  });

  describe('caching', () => {
    it('2nd getProducts call gets from cache', (done) => {
      const list = MOCK_PRODUCTS;
      service.getProducts(BRAND_ID).subscribe((products: Product[]) => {
        expect(products).toEqual(list);
        expect(catalogItemsService.getCache(itemType)).toEqual(list);
        expect(service.cachedBrandId).toEqual(BRAND_ID);
      });
      const URL = service.productsApiUrl.replace(':tenantId', BRAND_ID);

      const mockRequests = httpMock.match((req) => {
        return req.urlWithParams === `${URL}?size=100`;
      });
      expect(mockRequests.length).toBe(1);
      mockRequests.forEach((m) => {
        expect(m.request.method).toBe('GET');
        m.flush({ _embedded: { products: list } });
      });

      const spy = spyOn(getTestBed().inject(PaginationService), 'fetchAllPages').and.callThrough();

      // 2nd get
      service.getProducts(BRAND_ID).subscribe((products: Product[]) => {
        expect(products).toEqual(list);
        expect(spy).not.toHaveBeenCalled();
        done();
      });
    });

    it('2nd getProducts call returns observable if cache empty', (done) => {
      const list = MOCK_PRODUCTS;
      const firstSub = service.getProducts(BRAND_ID);
      firstSub.subscribe((products: Product[]) => {
        expect(products).toEqual(list);
        expect(catalogItemsService.getCache(itemType)).toEqual(list);
        expect(service.cachedBrandId).toEqual(BRAND_ID);
      });
      const URL = service.productsApiUrl.replace(':tenantId', BRAND_ID);

      const mockRequests = httpMock.match((req) => {
        return req.urlWithParams === `${URL}?size=100`;
      });
      expect(mockRequests.length).toBe(1);
      mockRequests.forEach((m) => {
        expect(m.request.method).toBe('GET');
        m.flush({ _embedded: { products: list } });
      });

      const spy = spyOn(getTestBed().inject(PaginationService), 'fetchAllPages').and.callThrough();

      // 2nd get
      catalogItemsService.updateCache(itemType);

      const secondSub = service.getProducts(BRAND_ID);
      secondSub.subscribe((products: Product[]) => {
        expect(products).toEqual(list);
        expect(spy).not.toHaveBeenCalled();
        done();
      });
      expect(secondSub).toEqual(firstSub);
    });

    it('2nd getProducts call w/ different brand resets cache', (done) => {
      const NEW_BRAND_ID = '333';
      const NEW_PRODUCTS = [
        {
          catalogEntryId: '5567',
          title: 'New Product',
          description: 'New Product',
          name: 'Product',
          modifierGroupIds: [],
        },
      ];

      const list = MOCK_PRODUCTS;
      service.getProducts(BRAND_ID).subscribe((products: Product[]) => {
        expect(products).toEqual(list);
        expect(catalogItemsService.getCache(itemType)).toEqual(list);
        expect(service.cachedBrandId).toEqual(BRAND_ID);
      });

      // 1st request
      const URL = service.productsApiUrl.replace(':tenantId', BRAND_ID);
      const mockRequests = httpMock.match((req) => {
        return req.urlWithParams === `${URL}?size=100`;
      });
      expect(mockRequests.length).toBe(1);
      mockRequests.forEach((m) => {
        expect(m.request.method).toBe('GET');
        m.flush({ _embedded: { products: list } });
      });

      const spy = spyOn(getTestBed().inject(PaginationService), 'fetchAllPages').and.callThrough();

      // 2nd get
      service.getProducts(NEW_BRAND_ID).subscribe((products: Product[]) => {
        expect(products).toEqual(NEW_PRODUCTS);
        expect(spy).toHaveBeenCalled();
        expect(catalogItemsService.getCache(itemType)).toEqual(NEW_PRODUCTS);
        expect(service.cachedBrandId).toEqual(NEW_BRAND_ID);
        done();
      });

      // 2nd request
      const URL2 = service.productsApiUrl.replace(':tenantId', NEW_BRAND_ID);
      const mockRequests2 = httpMock.match((req) => {
        return req.urlWithParams === `${URL2}?size=100`;
      });
      expect(mockRequests2.length).toBe(1);
      mockRequests2.forEach((m) => {
        expect(m.request.method).toBe('GET');
        m.flush({ _embedded: { products: NEW_PRODUCTS } });
      });
    });

    it('new product gets added to cache', (done) => {
      service.cachedBrandId = BRAND_ID;
      catalogItemsService.updateCache(itemType, MOCK_PRODUCTS);

      service.create(MOCK_PRODUCT, BRAND_ID).subscribe((product: Product) => {
        expect(product).toEqual(MOCK_PRODUCT);
        expect(catalogItemsService.getCache(itemType)).toEqual(MOCK_PRODUCTS.concat(MOCK_PRODUCT));
        done();
      });

      const URL = service.productsApiUrl.replace(':tenantId', BRAND_ID);
      const mockRequest = httpMock.expectOne(URL);
      expect(mockRequest.request.method).toBe('POST');
      expect(mockRequest.request.body).toEqual(MOCK_PRODUCT);
      mockRequest.flush(MOCK_PRODUCT);
    });

    it('updateValue updates item in cache', () => {
      service.cachedBrandId = BRAND_ID;
      catalogItemsService.updateCache(itemType, MOCK_PRODUCTS);
      const product = {
        catalogEntryId: '11111',
        title: 'New Smash',
        description: 'New Smash',
        name: 'New Smash',
        modifierGroupIds: [],
      };

      catalogItemsService.updateItemCache(product, itemType);

      expect(catalogItemsService.getCache(itemType)).not.toEqual(MOCK_PRODUCTS);
      expect(catalogItemsService.getCache(itemType)).toEqual([product, ...MOCK_PRODUCTS.slice(1)]);
    });

    it('updateValue does not update cache if cache undefined', () => {
      service.cachedBrandId = undefined;
      catalogItemsService.clearCache(itemType);

      const product = {
        catalogEntryId: '11111',
        title: 'New Smash',
        description: 'New Smash',
        name: 'New Smash',
        modifierGroupIds: [],
      };

      catalogItemsService.updateItemCache(product, itemType);

      expect(catalogItemsService.getCache(itemType)).toBeUndefined();
    });

    it('updateValue does not update cache if id not found', () => {
      service.cachedBrandId = BRAND_ID;
      catalogItemsService.updateCache(itemType, MOCK_PRODUCTS);

      const product = {
        catalogEntryId: 'BAD1',
        title: 'New Smash',
        description: 'New Smash',
        name: 'New Smash',
        modifierGroupIds: [],
      };

      catalogItemsService.updateItemCache(product, itemType);
      expect(catalogItemsService.getCache(itemType)).toEqual(MOCK_PRODUCTS);
    });

    it('should update cached products on item delete', () => {
      catalogItemsService.updateCache(itemType, MOCK_CACHED_PRODUCTS);
      catalogItemsService.deleteItemFromCache('11111', itemType);
      expect(catalogItemsService.getCache(itemType).length).toEqual(3);
    });
  });
});
