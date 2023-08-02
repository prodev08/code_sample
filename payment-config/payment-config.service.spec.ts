import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { getTestBed, TestBed } from '@angular/core/testing';

import { PaymentConfigService } from './payment-config.service';

describe('PaymentConfigService', () => {
  let injector: TestBed;
  let httpMock: HttpTestingController;
  let service: PaymentConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaymentConfigService],
      imports: [HttpClientTestingModule],
    });

    injector = getTestBed();
    service = injector.inject(PaymentConfigService);
    httpMock = injector.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
