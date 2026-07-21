import { Component, OnInit } from '@angular/core';
// Declare jquery as any
declare const $: any;
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { SignInService } from './../../auth/sign-in/sign-in.service';

@Component({
    selector: 'app-administrator',
    templateUrl: './administrator.component.html',
    styleUrls: ['./administrator.component.scss'],
    imports: [RouterLink, RouterOutlet]
})
export class AdministratorComponent implements OnInit {

  private clientId: string;
  public isAdmin: boolean;

  constructor(private auth: SignInService, private router: Router) { }

  ngOnInit(): void {
    // tabs
    $('.tabs').tabs();
    // dropdown
    $('.dropdown-trigger').dropdown({
      coverTrigger: false
    });

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
