import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Order } from 'src/app/common/order';
import { OrderItem } from 'src/app/common/order-item';
import { OrderStatus } from 'src/app/common/order-status';
import { Purchase } from 'src/app/common/purchase';
import { CartService } from 'src/app/services/cart.service';
import { CheckoutService } from 'src/app/services/checkout.service';
import { ShopFormService } from 'src/app/services/shop-form.service';
import { ShopValidators } from 'src/app/validators/shop-validators';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  checkoutFormGroup: FormGroup;

  totalPrice: number = 0;
  totalQuantity: number = 0;

  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  storage: Storage = sessionStorage;
  
  constructor(private formBuilder: FormBuilder,
              private shopFormService: ShopFormService,
              private cartService: CartService,
              private checkoutService: CheckoutService,
              private router: Router) { }

  ngOnInit(): void {

    this.reviewCartDetails();
    
    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('', 
        [Validators.required, 
         Validators.minLength(2),
         ShopValidators.notOnlyWhitespace
        ]),

        lastName: new FormControl('', 
        [Validators.required, 
         Validators.minLength(2)]),
        
         email: new FormControl('', 
        [Validators.required, 
         Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')])
      }),
      shippingAddress: this.formBuilder.group({
        street: new FormControl('', 
        [Validators.required, 
         Validators.minLength(2),
         ShopValidators.notOnlyWhitespace]),

        city: new FormControl('', [Validators.required]), 

        country: new FormControl('', [Validators.required]), 
        
        zipCode: new FormControl('', 
        [Validators.required, 
         Validators.minLength(2),
         ShopValidators.notOnlyWhitespace])
      }),
      billingAddress: this.formBuilder.group({
        street: new FormControl('', 
        [Validators.required, 
         Validators.minLength(2),
         ShopValidators.notOnlyWhitespace]
         ),

        city: new FormControl('', [Validators.required]), 

        country: new FormControl('', [Validators.required]), 
        
        zipCode: new FormControl('', 
        [Validators.required, 
         Validators.minLength(2),
         ShopValidators.notOnlyWhitespace])
      }),
      creditCard: this.formBuilder.group({
        cardType: new FormControl('', 
        [Validators.required]),
        nameOnCard: new FormControl('', 
        [Validators.required]),
        cardNumber: new FormControl('', 
        [Validators.required]),
        securityCode: new FormControl('', 
        [Validators.required]),
        expirationMonth: [''],
        expirationYear: ['']
      })
    });

    // populate credit card months
    const startMonth: number = new Date().getMonth() + 1;
    console.log("startMonth: " + startMonth);

    this.shopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log("Retrieved credit card months: " + JSON.stringify(data));
        this.creditCardMonths = data;
      }
    );

    // populate credit card years
    this.shopFormService.getCreditCardYears().subscribe(
      data => {
        console.log("Retrieved credit card years: " + JSON.stringify(data));
        this.creditCardYears = data;
      }
    );
  } 

  reviewCartDetails() {
    // subscribe to cartService.totalQuantity and cartService.totalPrice
    this.cartService.totalQuantity.subscribe(
      totalQuantity => this.totalQuantity = totalQuantity
    );
    this.cartService.totalPrice.subscribe(
      totalPrice => this.totalPrice = totalPrice
    );
  }

  get firstName(){ return this.checkoutFormGroup.get('customer.firstName'); }
  get lastName(){ return this.checkoutFormGroup.get('customer.lastName'); }
  get email(){ return this.checkoutFormGroup.get('customer.email'); }
  get shippingAddressStreet(){ return this.checkoutFormGroup.get('shippingAddress.street'); }
  get shippingAddressCity(){ return this.checkoutFormGroup.get('shippingAddress.city'); }
  get shippingAddressCountry(){ return this.checkoutFormGroup.get('shippingAddress.country'); }
  get shippingAddressZipCode(){ return this.checkoutFormGroup.get('shippingAddress.zipCode'); }
  get billingAddressStreet(){ return this.checkoutFormGroup.get('billingAddress.street'); }
  get billingAddressCity(){ return this.checkoutFormGroup.get('billingAddress.city'); }
  get billingAddressCountry(){ return this.checkoutFormGroup.get('billingAddress.country'); }
  get billingAddressZipCode(){ return this.checkoutFormGroup.get('billingAddress.zipCode'); }
  get creditCardType(){ return this.checkoutFormGroup.get('creditCard.cardType'); }
  get creditCardNameOnCard(){ return this.checkoutFormGroup.get('creditCard.nameOnCard'); }
  get creditCardNumber(){ return this.checkoutFormGroup.get('creditCard.cardNumber'); }
  get creditCardSecurityCode(){ return this.checkoutFormGroup.get('creditCard.securityCode'); }
  
  copyShippingAddressToBillingAddress(event: { target: { checked: any; }; }) {

    if (event.target.checked) {
      this.checkoutFormGroup.controls.billingAddress
            .setValue(this.checkoutFormGroup.controls.shippingAddress.value);
    }
    else {
      this.checkoutFormGroup.controls.billingAddress.reset();
    }
    
  }

  onSubmit() {
    console.log("Handling the submit button");

    if (this.checkoutFormGroup.invalid) {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

    // set up order
    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    let orderStatus = new OrderStatus();
    orderStatus.status ="fulfilled";

    // get cart items
    const cartItems = this.cartService.cartItems;

    // create orderItems from cartItems
    let orderItems: OrderItem[] = cartItems.map(tempCartItem => new OrderItem(tempCartItem));

    
    // set up purchase
    let purchase = new Purchase();
    
    // populate purchase - customer
    purchase.customer = this.checkoutFormGroup.controls['customer'].value;
    
    // populate purchase - shipping address
    purchase.shippingAddress = this.checkoutFormGroup.controls['shippingAddress'].value;
    const shippingCity: string = JSON.parse(JSON.stringify(purchase.shippingAddress.city));
    const shippingCountry: string = JSON.parse(JSON.stringify(purchase.shippingAddress.country));
    purchase.shippingAddress.city = shippingCity;
    purchase.shippingAddress.country = shippingCountry;


    // populate purchase - billing address
    purchase.billingAddress = this.checkoutFormGroup.controls['billingAddress'].value;
    const billingCity: string = JSON.parse(JSON.stringify(purchase.billingAddress.city));
    const billingCountry: string = JSON.parse(JSON.stringify(purchase.billingAddress.country));
    purchase.billingAddress.city = billingCity;
    purchase.billingAddress.country = billingCountry;
  
    // populate purchase - using the order and orderItems
    purchase.order = order;
    purchase.orderItems = orderItems;

    // call REST API via the CheckoutService
    this.checkoutService.placeOrder(purchase).subscribe({
        next: response => {
          alert(`Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`);

          // reset cart
          this.resetCart();

        },
        error: err => {
          alert(`There was an error: ${err.message}`);
        }
      }
    );
  }

  resetCart() {
    // reset cart data
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);
    
    // reset the form
    this.checkoutFormGroup.reset();

    // navigate back to the products page
    this.router.navigateByUrl("/products");
  }

  
  handleMonthsAndYears() {

    const creditCardFormGroup = this.checkoutFormGroup.get('creditCard');

    const currentYear: number = new Date().getFullYear();
    const selectedYear: number = Number(creditCardFormGroup!.value.expirationYear);

    // if the current year equals the selected year, then start with the current month

    let startMonth: number;

    if (currentYear === selectedYear) {
      startMonth = new Date().getMonth() + 1;
    }
    else {
      startMonth = 1;
    }

    this.shopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        this.creditCardMonths = data;
      }
    );
  }

}
