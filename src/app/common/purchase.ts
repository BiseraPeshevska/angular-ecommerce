import { Address } from "./address";
import { Customer } from "./customer";
import { Order } from "./order";
import { OrderItem } from "./order-item";
import { OrderStatus } from "./order-status";

export class Purchase {
    customer: Customer;
    shippingAddress: Address;
    billingAddress: Address;
    order: Order;
    orderItems: OrderItem[];
    orderStatuses: OrderStatus[];
}
