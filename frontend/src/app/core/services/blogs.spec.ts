import { TestBed } from '@angular/core/testing';

import { Blogs } from './blogs';

describe('Blogs', () => {
  let service: Blogs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Blogs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
