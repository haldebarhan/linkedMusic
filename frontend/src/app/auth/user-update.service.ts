import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AuthUser } from '../shared/interfaces/auth';

@Injectable({ providedIn: 'root' })
export class UserUpdateService {
  private userUpdated$ = new Subject<Partial<AuthUser>>();

  userUpdates$ = this.userUpdated$.asObservable();

  notifyUserUpdate(userData: Partial<AuthUser>) {
    this.userUpdated$.next(userData);
  }
}
