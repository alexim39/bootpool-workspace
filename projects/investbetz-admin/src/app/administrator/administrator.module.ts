import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdministratorComponent } from './administrator.component';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {UsersModule} from './users/users.module';
import {WagersModule} from './wagers/wagers.module';


@NgModule({
    imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    UsersModule,
    WagersModule,
    AdministratorComponent
],
    exports: [
        AdministratorComponent
    ]
})
export class AdministratorModule { }
