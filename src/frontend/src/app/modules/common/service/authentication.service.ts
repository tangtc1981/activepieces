import {Injectable} from '@angular/core';
import {BehaviorSubject, map, Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {User} from '../model/user.interface';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Router} from '@angular/router';
import {JwtHelperService} from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  public currentUserSubject: BehaviorSubject<User | undefined> = new BehaviorSubject<User | undefined>(
    this.currentUser
  );

  private jwtHelper = new JwtHelperService();

  constructor(private router: Router, private http: HttpClient) {
  }

  get currentUser(): User {
    return JSON.parse(localStorage.getItem(environment.userPropertyNameInLocalStorage) || '{}');
  }

  signIn(request: { email; password }): Observable<HttpResponse<User>> {
    return this.http.post<User>(environment.apiUrl + '/authentication/sign-in', request, {
      observe: 'response',
    });
  }

  signUp(request: { email; password; firstName; lastName; newsLetter; trackEvents;}): Observable<HttpResponse<User>> {
    return this.http.post<User>(environment.apiUrl + '/authentication/sign-up', request, {
      observe: 'response',
    });
  }

  saveToken(response: HttpResponse<any>) {
    localStorage.setItem(environment.jwtTokenName, response.body.token);
  }

  saveUser(response: HttpResponse<any>) {
    this.saveToken(response);
    this.updateUser(response.body);
  }

  updateUser(user: User) {
    localStorage.setItem(environment.userPropertyNameInLocalStorage, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  isLoggedIn() {
    let jwtToken: any = localStorage.getItem(environment.jwtTokenName);
    if (jwtToken == null) {
      jwtToken = undefined;
    }
    try {
      if (jwtToken && this.jwtHelper.isTokenExpired(jwtToken)) {
        this.logout();
        return false;
      }
    } catch (exception_var) {
      this.logout();
      return false;
    }
    return localStorage.getItem(environment.jwtTokenName) != null;
  }

  logout(): void {
    localStorage.removeItem(environment.jwtTokenName);
    localStorage.removeItem(environment.userPropertyNameInLocalStorage);
    this.currentUserSubject.next(undefined);
    this.router.navigate(['sign-in']);
  }

  isFirstSignIn() {
    return this.http.get<boolean>(environment.apiUrl + '/flags').pipe(map(value => {
      return !(value['USER_CREATED']??false);
    }));
  }

  saveNewsLetterSubscriber(email: string) {
    return this.http.post(
      'https://us-central1-activepieces-b3803.cloudfunctions.net/addContact',
      {email: email},
      {responseType: 'text'}
    );
  }
}
