import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersComponent } from './users.component';
import {UsersService} from './users.service';


@NgModule({
    imports: [
        CommonModule,
        UsersComponent
    ],
    exports: [
        UsersComponent
    ],
    providers: [UsersService]
})
export class UsersModule { }
