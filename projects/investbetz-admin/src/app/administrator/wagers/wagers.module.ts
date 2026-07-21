import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WagersUploadComponent } from './wagers-upload/wagers-upload.component';
import { WagersUpdateComponent } from './wagers-update/wagers-update.component';
import { FormsModule }   from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import {WagersService} from './wager.service';



@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        WagersUploadComponent,
        WagersUpdateComponent
    ],
    exports: [
        WagersUploadComponent,
        WagersUpdateComponent
    ],
    providers: [WagersService]
})
export class WagersModule { }
