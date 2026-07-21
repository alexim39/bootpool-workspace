export abstract class Users {
  /**
   * Creates an instance of a User.
   * @param firstname The user's first name.
   * @param lastname The user's last name.
   * @param homeAddress The user's home address.
   * @param phone The user's phone number.
   * @param email The user's email address.
   * @param birthday The user's date of birth.
   */

  protected firstname!: string;
  protected lastname!: string;
  protected adress!: string;
  protected phone!: string;
  protected email!: string;
  protected birthday!: Date
  
  protected constructor( ) {}
}
