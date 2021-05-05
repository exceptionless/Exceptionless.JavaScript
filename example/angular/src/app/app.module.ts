import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Exceptionless } from "@exceptionless/browser";
import { AppComponent } from './app.component';

class MyErrorHandler implements ErrorHandler {
  handleError(error: any) {
    Exceptionless.submitException(error);
  }
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [{ provide: ErrorHandler, useClass: MyErrorHandler }],
  bootstrap: [AppComponent]
})
export class AppModule { }
