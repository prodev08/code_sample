import { Injectable } from '@angular/core';
import * as ngCommonHttp from '@angular/common/http';

import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AbstractOrdersService } from '@abstract-services/orders/1.0/orders.abstract-class';
import {
  CheckoutCancelStatus,
  OrderDetails,
  OrderRefund,
  OrderSummaries,
  OrderSummariesResponse,
} from '@interfaces/orders/1.0';
import { OrdersAPI } from '@constants/api';

@Injectable({
  providedIn: 'root',
})
export class OrdersService implements AbstractOrdersService {
  ordersApiUrl: string;
  orderByIdApiUrl: string;
  orderCanCancelApiUrl: string;
  orderCancelApiUrl: string;
  orderRefundApiUrl: string;

  constructor(private http: ngCommonHttp.HttpClient) {
    this.ordersApiUrl = OrdersAPI.GET;
    this.orderByIdApiUrl = OrdersAPI.GET_ORDER_BY_ID;
    this.orderCanCancelApiUrl = OrdersAPI.GET_ORDER_CAN_CANCEL;
    this.orderCancelApiUrl = OrdersAPI.POST_ORDER_CANCEL;
    this.orderRefundApiUrl = OrdersAPI.POST_ORDER_REFUND;
  }

  /**
   * Gets all orders
   *
   * @returns observable of all orders
   */
  getOrderSummaries(params?: string): Observable<OrderSummaries[]> {
    const Url = params ? this.ordersApiUrl + params : OrdersAPI.GET;
    return this.http.get(`${Url}`).pipe(
      map((response: OrderSummariesResponse) => {
        if (response._embedded && response._embedded.orderSummaries.length) {
          return response._embedded.orderSummaries;
        } else {
          return undefined;
        }
      }),
      catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
    );
  }

  /**
   * Gets order by OrderId
   *
   * @returns observable of an OrderDetails
   */
  getOrderById(orderId: string): Observable<OrderDetails> {
    const url = this.orderByIdApiUrl.replace(':orderId', orderId);
    return this.http.get(`${url}`).pipe(
      map((response: OrderDetails) => {
        return response;
      }),
      catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)),
    );
  }

  /**
   * Cancels an order by OrderId
   *
   * @returns observable of an CheckoutCancelStatus
   */
  postOrderCancel(tenantId: string, orderId: string): Observable<CheckoutCancelStatus> {
    const url = this.orderCancelApiUrl.replace(':tenantId', tenantId).replace(':orderId', orderId);
    return this.http
      .post(`${url}`, {})
      .pipe(catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)));
  }

  /**
   * Refunds an order by TransactionId
   *
   * @returns observable of an OrderRefund
   */
  postOrderRefund(tenantId: string, transactionId: string): Observable<OrderRefund> {
    const url = this.orderRefundApiUrl
      .replace(':tenantId', tenantId)
      .replace(':transactionId', transactionId);
    return this.http
      .post(`${url}`, {})
      .pipe(catchError((err: ngCommonHttp.HttpErrorResponse) => throwError(err)));
  }
}
