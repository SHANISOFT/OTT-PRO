import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected network error occurred.';

      if (error.error && typeof error.error === 'object' && error.error.message) {
        errorMessage = error.error.message;
        if (error.error.errors && error.error.errors.length > 0) {
          errorMessage += ` (${error.error.errors.join(', ')})`;
        }
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the OTT PRO server. Please check your connection.';
      } else if (error.status === 401) {
        errorMessage = 'Your session has expired. Please sign in again.';
        router.navigate(['/auth/login']);
      } else if (error.status === 403) {
        errorMessage = 'Access denied: You do not have permission for this action.';
      } else if (error.status === 404) {
        errorMessage = 'Requested content could not be found.';
      }

      toast.error(errorMessage);
      return throwError(() => error);
    })
  );
};
