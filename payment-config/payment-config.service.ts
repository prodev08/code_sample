import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import * as ngCommonHttp from '@angular/common/http';
import { PaymentAdapterConfig } from '@generated/pgaas/models';
import { PaymentConfigAPI } from '@constants/api';
import { ApiService } from '@generated/pgaas/services/api.service';
import {
  PaymentAdapterConfigRequest,
  PaymentAdapterConfigTemplateRequest,
} from '@generated/pgaas/models';

@Injectable({
  providedIn: 'root',
})
export class PaymentConfigService {
  getAllAdapters = PaymentConfigAPI.GET_ALL_ADAPTERS;
  getTemplateDetailsUrl = PaymentConfigAPI.GET_TEMPLATE_DETAILS;
  getAdapterConfigurationUrl = PaymentConfigAPI.GET_ADAPTER_CONFIGURATION;

  constructor(private http: ngCommonHttp.HttpClient, private apiService: ApiService) {}

  /**
   * Get list of all adapters (not by brand)
   * @param brandId
   */
  getAllAdaptersList(brandId): Observable<any> {
    return this.http
      .get(this.getAllAdapters, {
        params: { pgaas: true },
        headers: { 'tenant-code': brandId },
      })
      .pipe(
        map((response: PaymentAdapterConfig[]) => {
          return response;
        }),
        catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
      );
  }

  /**
   * Gets Payment templates by tenant
   *
   * @param brandId
   */
  getAllTemplates(brandId): Observable<any> {
    return this.apiService
      .getPaymentAdapterConfigTemplatesByTenantCode({
        'tenant-code': brandId,
      })
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
      );
  }

  /**
   * Gets Payment template details by template id
   * @param brandId
   * @param templateId
   */
  getTemplateDetails(brandId, templateId): Observable<any> {
    return this.apiService
      .getTenantPaymentAdapterConfigTemplate({
        'tenant-code': brandId,
        templateId,
      })
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
      );
  }

  /**
   * delete Payment template details by template id
   * @param brandId
   * @param templateId
   */
  deleteTemplate(brandId, templateId): Observable<any> {
    const url = this.getTemplateDetailsUrl.replace(':templateId', templateId);

    return this.http
      .delete(url, {
        params: { pgaas: true },
        headers: { 'tenant-code': brandId },
      })
      .pipe(
        map((response: PaymentAdapterConfig[]) => {
          return response;
        }),
        catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
      );
  }

  /**
   * Gets adapter properties by tenantId
   *
   * @param brandId
   */
  getAdapterConfigurationBadURL(brandId, adapter): Observable<any> {
    // get allowed adapters list for tenant
    return this.apiService
      .getTenantPaymentAdapterConfig({
        'tenant-code': brandId,
        adapter: adapter,
      })
      .pipe(
        map((response) => {
          return { schema: { properties: response.properties } };
        }),
        catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
      );
  }

  /**
   * Gets Payment templates by tenant
   *
   * @param brandId
   */
  getAdapterConfiguration(adapter): Observable<any> {
    const url = this.getAdapterConfigurationUrl.replace(':adapterId', adapter);
    return this.http
      .get(url, {
        params: { pgaas: true },
      })
      .pipe(
        map((response: PaymentAdapterConfig[]) => {
          return response;
        }),
        catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
      );
  }

  // HTTP Functions
  /**
   * Saves a POS Config for a brand ID
   *
   * @param request - POS config
   * @param brandId - brand ID to save to
   */
  create(request: PaymentAdapterConfigTemplateRequest, brandId): Observable<any> {
    const body: PaymentAdapterConfigTemplateRequest = { ...request };
    body.payload = this.removeEmptyFields(request.payload);
    return this.apiService
      .createPaymentAdapterConfigTemplate({
        'tenant-code': brandId,
        body: body,
      })
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
      );
  }

  // HTTP Functions
  /**
   * Saves a POS Config for a brand ID
   *
   * @param request - POS config
   * @param brandId - brand ID to save to
   */
  update(request: PaymentAdapterConfigTemplateRequest, brandId, templateId): Observable<any> {
    const body: PaymentAdapterConfigTemplateRequest = { ...request };
    body.payload = this.removeEmptyFields(request.payload);

    return this.apiService
      .updateTenantPaymentAdapterConfigTemplate({
        'tenant-code': brandId,
        templateId: templateId,
        body: body,
      })
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
      );
  }

  /**
   * Returns a copy of the given object with all empty fields removed.
   *
   * @param fieldDefaults - object to remove empty strings from
   */
  private removeEmptyFields(fieldDefaults: any) {
    const cleanDefaults = { ...fieldDefaults };
    const keys = Object.keys(cleanDefaults);
    for (const key of keys) {
      if (cleanDefaults.hasOwnProperty(key)) {
        const value = cleanDefaults[key];
        if (value === '' || value === null || value === undefined) {
          delete cleanDefaults[key];
        }
      }
    }
    return cleanDefaults;
  }

  /**
   * Gets Payment adapter by tenantId
   *
   * @param brandId
   */
  getAllAdaptersListByStore(brandId, storeId): Observable<any> {
    // get allowed adapters list for tenant and store
    return this.apiService
      .getPaymentAdaptersByTenantCodeAndStoreNumber({
        'tenant-code': brandId,
        'store-number': storeId,
      })
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
      );
  }

  /**
   * Gets Payment adapter by tenantId
   *
   * @param brandId
   */
  getAdapterDetailsByStore(brandId, storeId, adapter): Observable<any> {
    // get allowed adapters list for tenant
    return this.apiService
      .getStorePaymentAdapterConfig({
        'tenant-code': brandId,
        'store-number': storeId,
        adapter: adapter,
      })
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
      );
  }

  // HTTP Functions
  /**
   * Saves a POS Config for a brand ID
   *
   * @param request - POS config
   * @param brandId - brand ID to save to
   */
  createStorePaymentConfig(
    request: PaymentAdapterConfigRequest,
    brandId,
    storeId,
  ): Observable<any> {
    const body: PaymentAdapterConfigRequest = { ...request };
    body.payload = this.removeEmptyFields(request.payload);
    return this.apiService
      .createStorePaymentAdapterConfig({
        'tenant-code': brandId,
        'store-number': storeId,
        body: body,
      })
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
      );
  }

  // HTTP Functions
  /**
   * Saves a POS Config for a brand ID
   *
   * @param request - POS config
   * @param brandId - brand ID to save to
   */
  updateStorePaymentConfig(
    request: PaymentAdapterConfigRequest,
    brandId,
    storeId,
  ): Observable<any> {
    const body: PaymentAdapterConfigRequest = { ...request };
    body.payload = this.removeEmptyFields(request.payload);
    return this.apiService
      .updateStorePaymentAdapterConfig({
        'tenant-code': brandId,
        'store-number': storeId,
        adapter: body.context.correlationContext.adapter,
        body: body,
      })
      .pipe(
        map((response) => {
          return response;
        }),
        catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
      );
  }
}
