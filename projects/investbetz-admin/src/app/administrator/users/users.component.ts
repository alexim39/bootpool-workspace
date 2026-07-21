import { Component, OnInit } from '@angular/core';
// Declare jquery as any
declare const $: any;
import { Router } from '@angular/router';
import { SignInService } from './../../../auth/sign-in/sign-in.service';
import {UsersService} from './users.service';
import { NgFor, LowerCasePipe, TitleCasePipe, DatePipe } from '@angular/common';


@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss'],
    imports: [NgFor, LowerCasePipe, TitleCasePipe, DatePipe]
})
export class UsersComponent implements OnInit {

  private clientId: string;
  public isAdmin: boolean;
  public usrs: any;

  constructor(private auth: SignInService, private router: Router, private usersService: UsersService) { }

  private users() {

    this.usersService.getUsers().subscribe((response: any) => {
      if (response.message === 'done') {


         this.usrs = response.data;

      }
    }, (error) => {
      console.error(error);
    })
  }

  ngOnInit(): void {
    // get all users
    this.users();

    // Load Current User Details
    this.auth.profile().subscribe((user: any) => {
      this.clientId = user._id;
      if (user.userType === 'admin') {
        this.isAdmin = true;
      }
    }, (error) => {
      // disable btn
      console.error(error)
    });
  }

}
