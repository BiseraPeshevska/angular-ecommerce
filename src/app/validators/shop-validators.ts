import { FormControl, ValidationErrors } from "@angular/forms";

export class ShopValidators {
    // whitespace validation

    static notOnlyWhitespace(control: FormControl): ValidationErrors {

        // check if string only has whitespace
        if((control.value != null) && (control.value.trim().length === 0)){
            return { 'notOnlyWhitespace': true };
        }
        else {
            // valid string
            return null!;
        }
    }
}
