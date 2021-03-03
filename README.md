# orbit-jwt
[![Build Status](https://travis-ci.org/orbitturner/orbit-jwt.svg?branch=master)](https://travis-ci.org/orbitturner/orbit-jwt)
[![npm version](https://img.shields.io/npm/v/orbit-jwt.svg)](https://www.npmjs.com/package/orbit-jwt) [![license](https://img.shields.io/npm/l/orbit-jwt.svg)](https://www.npmjs.com/package/orbit-jwt)

**orbit-jwt** is a helper library for working with [JWTs](http://jwt.io/introduction) in your Angular applications.

<p align="center">
  <a href="http://orbitturner.com/"><img src="https://raw.githubusercontent.com/orbitturner/ORBIT_SUGAR_CODES/master/assets/ORBIT-JWT-ANNOUNCEMENT-1024.png" width="auto" alt="Orbit-JWT COVER"/></a>
</p>


##Contents
- [orbit-jwt](#orbit-jwt)
  * [What is this Library for?](#what-is-this-library-for-)
  * [Key Features](#key-features)
  * [Installation](#installation)
  * [Usage: Standalone](#usage--standalone)
  * [Usage: Injection](#usage--injection)
  * [Configuration Options](#configuration-options)
    + [`tokenGetter: function(HttpRequest): string`](#-tokengetter--function-httprequest---string-)
    + [`allowedDomains: array`](#-alloweddomains--array-)
    + [`disallowedRoutes: array`](#-disallowedroutes--array-)
    + [`headerName: string`](#-headername--string-)
    + [`authScheme: string | function(HttpRequest): string`](#-authscheme--string---function-httprequest---string-)
    + [`throwNoTokenError: boolean`](#-thrownotokenerror--boolean-)
    + [`skipWhenExpired: boolean`](#-skipwhenexpired--boolean-)
  * [Using a Custom Options Factory Function](#using-a-custom-options-factory-function)
  * [Configuration for Ionic 2+](#configuration-for-ionic-2-)
  * [Configuration Options](#configuration-options-1)
    + [`JwtHelperService: service`](#-jwthelperservice--service-)
  * [isTokenExpired (old tokenNotExpired function)](#istokenexpired--old-tokennotexpired-function-)
  * [getTokenExpirationDate](#gettokenexpirationdate)
  * [decodeToken](#decodetoken)
  * [Contributing](#contributing)
  * [Issue Reporting](#issue-reporting)
  * [GREETINGS](#greetings)
  * [Author](#author)
  * [License](#license)



## What is this Library for?

**orbit-jwt** is a small and unopinionated library that is useful for automatically attaching a [JSON Web Token (JWT)](http://jwt.io/introduction) as an `Authorization` header when making HTTP requests from an Angular 2 app. It also has a number of helper methods that are useful for doing things like decoding JWTs.

This library does not have any functionality for (or opinion about) implementing user authentication and retrieving JWTs to begin with. Those details will vary depending on your setup, but in most cases, you will use a regular HTTP request to authenticate your users and then save their JWTs in local storage or in a cookie if successful.

> **Note:** This library can only be used with Angular 4.3 and higher because it relies on an `HttpInterceptor` from Angular's `HttpClient`. This feature is not available on lower versions.



## Key Features

* Send a JWT on a per-request basis using the **explicit `AuthHttp`** class
* **Decode a JWT** from your Angular 10+ app
* Check the **expiration date** of the JWT
* Conditionally allow **route navigation** based on JWT status



## Installation

```bash
# installation with npm
npm install orbit-jwt

# installation with yarn
yarn add orbit-jwt
```

**This library relies on the URL interface which is not supported in IE11.**
To solve the IE11 compatibility, you can add a polyfill.

- run `npm i --save url-polyfill`
- add `import 'url-polyfill';` to `polyfills.ts` in your project

## Usage: Standalone

If you are only interested in the JWT Decoder, and are not interested in extended
injectable features, you can simply create an instance of the utility and use it
directly:

```ts
import { JwtHelperService } from "orbit-jwt";

const helper = new JwtHelperService();

const decodedToken = helper.decodeToken(myRawToken);
const expirationDate = helper.getTokenExpirationDate(myRawToken);
const isExpired = helper.isTokenExpired(myRawToken);
```

## Usage: Injection

Import the `JwtModule` module and add it to your imports list. Call the `forRoot` method and provide a `tokenGetter` function. You must also add any domains to the `allowedDomains`, that you want to make requests to by specifying an `allowedDomains` array.

Be sure to import the `HttpClientModule` as well.

```ts
import { JwtModule } from "orbit-jwt";
import { HttpClientModule } from "@angular/common/http";

export function tokenGetter() {
  return localStorage.getItem("access_token");
}

@NgModule({
  bootstrap: [AppComponent],
  imports: [
    // ...
    HttpClientModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: tokenGetter,
        allowedDomains: ["example.com"],
        disallowedRoutes: ["http://example.com/examplebadroute/"],
      },
    }),
  ],
})
export class AppModule {}
```

Any requests sent using Angular's `HttpClient` will automatically have a token attached as an `Authorization` header.

```ts
import { HttpClient } from "@angular/common/http";

export class AppComponent {
  constructor(public http: HttpClient) {}

  ping() {
    this.http.get("http://example.com/api/things").subscribe(
      (data) => console.log(data),
      (err) => console.log(err)
    );
  }
}
```

## Configuration Options

### `tokenGetter: function(HttpRequest): string`

The `tokenGetter` is a function which returns the user's token. This function simply needs to make a retrieval call to wherever the token is stored. In many cases, the token will be stored in local storage or session storage.

```ts
// ...
JwtModule.forRoot({
  config: {
    // ...
    tokenGetter: () => {
      return localStorage.getItem("access_token");
    },
  },
});
```

If you have multiple tokens for multiple domains, you can use the `HttpRequest` passed to the `tokenGetter` function to get the correct token for each intercepted request.

```ts
// ...
JwtModule.forRoot({
  config: {
    // ...
    tokenGetter: (request) => {
      if (request.url.includes("foo")) {
        return localStorage.getItem("access_token_foo");
      }

      return localStorage.getItem("access_token");
    },
  },
});
```

### `allowedDomains: array`

Authenticated requests should only be sent to domains you know and trust. Many applications make requests to APIs from multiple domains, some of which are not controlled by the developer. Since there is no way to know what the API being called will do with the information contained in the request, it is best to not send the user's token to all APIs in a blind fashion.

List any domains you wish to allow authenticated requests to be sent to by specifying them in the `allowedDomains` array. **Note that standard http port 80 and https port 443 requests don't require a port to be specified. A port is only required in the allowed domains host name if you are authenticating against a non-standard port e.g. localhost:3001**

```ts
// ...
JwtModule.forRoot({
  config: {
    // ...
    allowedDomains: ["localhost:4200", "orbit.com", "exemple.com"],
  },
});
```

### `disallowedRoutes: array`

If you do not want to replace the authorization headers for specific routes, list them here. This can be useful if your
initial auth route(s) are on an allowed domain and take basic auth headers. These routes need to be prefixed with the correct protocol (`http://`, `https://`). If you want to add a route to the list of disallowed routes regardless of the protocol, you can prefix it with `//`.

```ts
// ...
JwtModule.forRoot({
  config: {
    // ...
    disallowedRoutes: [
      "http://localhost:4200/auth/",
      "https://exemple.com/bar/",
      "//foo.com/bar/baz",
      /localhost:4200\/foo\/far.*/,
    ], // strings and regular expressions
  },
});
```

**Note:** If requests are sent to the same domain that is serving your Angular application, you do not need to add that domain to the `allowedDomains` array. However, this is only the case if you don't specify the domain in the `Http` request.

For example, the following request assumes that the domain is the same as the one serving your app. It doesn't need to be allowed in this case.

```ts
this.http.get('/api/things')
  .subscribe(...)
```

However, if you are serving your API at the same domain as that which is serving your Angular app **and** you are specifying that domain in `Http` requests, then it **does** need to be explicitely allowed.

```ts
// Both the Angular app and the API are served at
// localhost:4200 but because that domain is specified
// in the request, it must be allowed
this.http.get('http://localhost:4200/api/things')
  .subscribe(...)
```

### `headerName: string`

The default header name is `Authorization`. This can be changed by specifying a custom `headerName` which is to be a string value.

```ts
// ...
JwtModule.forRoot({
  config: {
    // ...
    headerName: "Your Header Name",
  },
});
```

### `authScheme: string | function(HttpRequest): string`

The default authorization scheme is `Bearer` followed by a single space. This can be changed by specifying a custom `authScheme`. You can pass a string which will prefix the token for each request.

```ts
// ...
JwtModule.forRoot({
  config: {
    // ...
    authScheme: "Basic ",
  },
});
```

If you want to change the auth scheme dynamically, or based on the request, you can configure a getter function which returns a string.

```ts
// ...
JwtModule.forRoot({
  config: {
    // ...
    authScheme: (request) => {
      if (request.url.includes("foo")) {
        return "Basic ";
      }

      return "Bearer ";
    },
  },
});
```

### `throwNoTokenError: boolean`

Setting `throwNoTokenError` to `true` will result in an error being thrown if a token cannot be retrieved with the `tokenGetter` function. Defaults to `false`.

```ts
// ...
JwtModule.forRoot({
  config: {
    // ...
    throwNoTokenError: true,
  },
});
```

### `skipWhenExpired: boolean`

By default, the user's JWT will be sent in `HttpClient` requests even if it is expired. You may choose to not allow the token to be sent if it is expired by setting `skipWhenExpired` to true.

```ts
// ...
JwtModule.forRoot({
  config: {
    // ...
    skipWhenExpired: true,
  },
});
```

## Using a Custom Options Factory Function

In some cases, you may need to provide a custom factory function to properly handle your configuration options. This is the case if your `tokenGetter` function relies on a service or if you are using an asynchronous storage mechanism (like Ionic's `Storage`).

Import the `JWT_OPTIONS` `InjectionToken` so that you can instruct it to use your custom factory function.

Create a factory function and specify the options as you normally would if you were using `JwtModule.forRoot` directly. If you need to use a service in the function, list it as a parameter in the function and pass it in the `deps` array when you provide the function.

```ts
import { JwtModule, JWT_OPTIONS } from 'orbit-jwt';
import { TokenService } from './app.tokenservice';

// ...

export function jwtOptionsFactory(tokenService) {
  return {
    tokenGetter: () => {
      return tokenService.getAsyncToken();
    },
    allowedDomains: ["example.com"]
  }
}

// ...

@NgModule({
  // ...
  imports: [
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
        deps: [TokenService]
      }
    })
  ],
  providers: [TokenService]
})
```

**Note:**: If a `jwtOptionsFactory` is defined, then `config` is ignored. _Both configuration alternatives can't be defined at the same time_.

## Configuration for Ionic 2+

The custom factory function approach described above can be used to get a token asynchronously with Ionic's `Storage`.

```ts
import { JwtModule, JWT_OPTIONS } from 'orbit-jwt';
import { Storage } from '@ionic/storage';

export function jwtOptionsFactory(storage) {
  return {
    tokenGetter: () => {
      return storage.get('access_token');
    },
    allowedDomains: ["example.com"]
  }
}

// ...

@NgModule({
  // ...
  imports: [
    JwtModule.forRoot({
      jwtOptionsProvider: {
        provide: JWT_OPTIONS,
        useFactory: jwtOptionsFactory,
        deps: [Storage]
      }
    })
  ]
})
```

**Note:**: If a `jwtOptionsFactory` is defined, then `config` is ignored. _Both configuration alternatives can't be defined at the same time_.

## Configuration Options

### `JwtHelperService: service`

This service contains helper functions:

## isTokenExpired (old tokenNotExpired function)

```
import { JwtHelperService } from 'orbit-jwt';
// ...
constructor(public jwtHelper: JwtHelperService) {}

ngOnInit() {
console.log(this.jwtHelper.isTokenExpired()); // true or false
}
```

## getTokenExpirationDate

```
import { JwtHelperService } from 'orbit-jwt';
// ...
constructor(public jwtHelper: JwtHelperService) {}

ngOnInit() {
console.log(this.jwtHelper.getTokenExpirationDate()); // date
}
```

## decodeToken

```
import { JwtHelperService } from 'orbit-jwt';
// ...
constructor(public jwtHelper: JwtHelperService) {}

ngOnInit() {
console.log(this.jwtHelper.decodeToken(token)); // token
}
```

## Contributing

Pull requests are welcome!


## Issue Reporting

If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](mailto:support@orbitturner.com) details the procedure for disclosing security issues.


## GREETINGS
❤❤ GREETING TO AUTH0 FOR DEEPLY INSPIRING ME ❤❤


## Author

[OrbitTurner](https://orbitturner.com)


## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
