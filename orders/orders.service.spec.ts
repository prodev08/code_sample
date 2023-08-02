import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { getTestBed, TestBed } from '@angular/core/testing';
import { DefaultUrlSerializer, UrlSerializer } from '@angular/router';

import { OrdersService } from './orders.service';

const MOCK_ORDER_SUMMARIES = [
  {
    tenantId: '933c5b45-836b-47e8-b99b-e433870b5636',
    orderId: 'c2ddc44f-8d2c-48bc-81fd-c30c5803e204',
    orderDate: '2021-04-06T13:03:13.743Z',
    estimatedTime: '2021-04-06T13:03:13.743Z',
    channelName: 'UBEREATS',
    channelTotal: 465.21,
    serviceType: 'DeliveryByChannel',
    paymentType: 1,
    user: {
      userId: 'a0ce99d0-04a3-4ed6-af6c-89048fe2861c',
      firstName: 'Carey',
      lastName: 'Medhurst',
      email: 'Meghan_Kutch@example.com',
      phone: '65-504-219-7043',
      address: {
        address1: '3441 Norris Coves',
        address2: null,
        city: 'New Kiley',
        state: null,
        postcode: null,
      },
    },
    store: {
      number: 700,
      storeId: '62e6c678-2655-4f5d-bed6-c78a132bb835',
      name: 'Paucek, Borer and Jaskolski',
    },
    currentOrderState: {
      key: 'COMPLETED',
      date: '2021-04-06T13:03:13.743Z',
      description: 'Completed',
    },
    checkId: 'a08bc963-403f-4f72-9b1b-9d52dc40ccc2',
    externalId: 'ubereats',
  },
  {
    tenantId: '933c5b45-836b-47e8-b99b-e433870b5636',
    orderId: 'b57a9e9f-0427-447e-bae8-64e9519ca38c',
    orderDate: '2021-04-06T13:03:13.743Z',
    estimatedTime: '2021-04-06T13:03:13.743Z',
    channelName: 'UBEREATS',
    channelTotal: 831.78,
    serviceType: 'DeliveryByChannel',
    paymentType: 1,
    user: {
      userId: '8d7fdade-0715-43db-8d19-4b185ecd9ecb',
      firstName: 'Ayla',
      lastName: 'Schmitt',
      email: 'Josefa.Beatty73@example.net',
      phone: '23-312-844-3688',
      address: {
        address1: '06004 Brody Ramp',
        address2: null,
        city: 'New Rylan',
        state: null,
        postcode: null,
      },
    },
    store: {
      number: 334,
      storeId: '08793e17-a10b-41fc-a164-ac49af099121',
      name: 'Kling, Gottlieb and Kassulke',
    },
    currentOrderState: {
      key: 'COMPLETED',
      date: '2021-04-06T13:03:13.743Z',
      description: 'Completed',
    },
    checkId: '228cd7f6-d379-450b-aa65-a0b53b580845',
    externalId: 'ubereats',
  },
];

describe('OrderService', () => {
  let injector: TestBed;
  let service: OrdersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrdersService, { provide: UrlSerializer, useClass: DefaultUrlSerializer }],
      imports: [HttpClientTestingModule],
    });

    injector = getTestBed();
    service = injector.inject(OrdersService);
    httpMock = injector.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getOrderSummaries works', (done) => {
    const URL = service.ordersApiUrl;
    service.getOrderSummaries().subscribe((response: any) => {
      expect(response).toEqual(MOCK_ORDER_SUMMARIES);
      done();
    });
    const mockRequest = httpMock.expectOne(URL);
    expect(mockRequest.request.method).toBe('GET');
    mockRequest.flush({ _embedded: { orderSummaries: MOCK_ORDER_SUMMARIES } });
  });

  it('getOrderSummaries response is undefined', (done) => {
    const URL = service.ordersApiUrl;
    service.getOrderSummaries().subscribe((response: any) => {
      expect(response).toEqual(undefined);
      done();
    });
    const mockRequest = httpMock.expectOne(URL);
    expect(mockRequest.request.method).toBe('GET');
    mockRequest.flush({ _embedded: undefined });
  });

  it('getOrderSummaries error handled', (done) => {
    service.getOrderSummaries().subscribe({
      error: (error) => {
        expect(error).toBeTruthy();
        done();
      },
    });
    const URL = service.ordersApiUrl;
    const mockRequest = httpMock.expectOne(URL);
    expect(mockRequest.request.method).toBe('GET');
    mockRequest.flush('error', { status: 500, statusText: 'Internal error' });
  });
});
