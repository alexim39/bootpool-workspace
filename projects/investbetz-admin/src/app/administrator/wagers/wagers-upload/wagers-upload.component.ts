import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormArray, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms'
// declare jquery as any
declare const $: any;
import {MatSnackBar} from '@angular/material/snack-bar';
import {WagersInterface} from './../wager.interface';
import {WagersService} from './../wager.service';
import { NgFor } from '@angular/common';



@Component({
    selector: 'app-wagers-upload',
    templateUrl: './wagers-upload.component.html',
    styleUrls: ['./wagers-upload.component.scss'],
    imports: [FormsModule, ReactiveFormsModule, NgFor]
})
export class WagersUploadComponent implements OnInit {

  //title = 'FormArray Example in Angular Reactive forms';
 
  wagerForm: FormGroup;
 
  constructor(private fb:FormBuilder, private snackBar: MatSnackBar, private wagersService: WagersService) {
 
    this.wagerForm = this.fb.group({
      odd: ['', Validators.required],
      //home: ['', Validators.required],
      //away: ['', Validators.required],
      //prediction: ['', Validators.required],
      wagerSession: ['', Validators.required],
      wagers: this.fb.array([]) ,
    });
  
  }
 
  get wagers() : FormArray {
    return this.wagerForm.get("wagers") as FormArray
  }
 
  private newWager(): FormGroup {
    return this.fb.group({
      homeObj: '',
      awayObj: '',
      predictionObj: '',
      gameType: '',
    })
  }
 
  public addWagers() {
    this.wagers.push(this.newWager());
  }
 
  public removeWager(i: number) {
    this.wagers.removeAt(i);
  }
 
  public onSubmit() {

    //console.log(this.wagerForm.value);
    if (this.wagerForm.value.wagerSession === 'morning') { // morning session
      //console.log('morning')

      this.wagersService.saveMorningWager(this.wagerForm.value).subscribe( (response: any) => {
        if (response.message === 'done') {
  
          this.snackBar.open(`Morning wager have been uploaded successfully`, 'Close', { 
            duration: 6000,
            panelClass: ['snackbar', 'success']
           });
        }    
        
      }, (error) => {
        this.snackBar.open(error.error.message, 'Close', { 
          duration: 6000,
          panelClass: ['snackbar', 'error']
         }); 
      });
      
      return; //return 
    } else if (this.wagerForm.value.wagerSession === 'noon') { // afternoon session
      //console.log('noon')

      this.wagersService.saveNoonWager(this.wagerForm.value).subscribe( (response: any) => {
        if (response.message === 'done') {
  
          this.snackBar.open(`Noon wager have been uploaded successfully`, 'Close', { 
            duration: 6000,
            panelClass: ['snackbar', 'success']
           });
        }    
        
      }, (error) => {
        this.snackBar.open(error.error.message, 'Close', { 
          duration: 6000,
          panelClass: ['snackbar', 'error']
         }); 
      });

      return; //return
    } else if (this.wagerForm.value.wagerSession === 'night') { // night session
      //console.log('night')

      this.wagersService.saveNightWager(this.wagerForm.value).subscribe( (response: any) => {
        if (response.message === 'done') {
  
          this.snackBar.open(`Night wager have been uploaded successfully`, 'Close', { 
            duration: 6000,
            panelClass: ['snackbar', 'success']
           });
        }    
        
      }, (error) => {
        this.snackBar.open(error.error.message, 'Close', { 
          duration: 6000,
          panelClass: ['snackbar', 'error']
         }); 
      });
      
      return; //return
    } else {
      this.snackBar.open('Please select a wager session', 'Close', { 
        duration: 6000,
        panelClass: ['snackbar', 'error']
       });
       return; //return 
    }
  }
 

  ngOnInit(): void {
  }

}



/* export class country {
  id: string;
  name: string;
 
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
 */