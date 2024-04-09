const purchase = [
  { id: "1", name: "t-shirt", price: 1999 },
  { id: "2", name: "shoes", price: 4999 },
];
const total_amount = 10998;
const shipping_fee = 1099;

var stripe = Stripe(
  "pk_test_51P3DLp1HJMQ8ri9ChQqXOFIkv5ghliQcpytCc6eBQPF9lHExK6zLPSAGyc2teYI2J7a8w3DepWOE7W5skMHHCqU100NOtw3rUo"
);

// The items the customer wants to buy

// Disable the button until we have Stripe set up on the page
document.querySelector("button").disabled = true;
fetch("/stripe", {
  /* NOTE */ method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ purchase, total_amount, shipping_fee }),
})
  .then(function (result) {
    return result.json(); //  after calling result.json(), we get a JavaScript object, not a string.
  })
  .then(function (data) {
    /* 2 */ var elements = stripe.elements(); // stripe.elements() is a function provided by the Stripe.js library that allows you to create Stripe Elements, which are customizable UI components used for collecting sensitive payment information securely.

    var style = {
      base: {
        color: "#32325d",
        fontFamily: "Arial, sans-serif",
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#32325d",
        },
      },
      invalid: {
        fontFamily: "Arial, sans-serif",
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    };
    /* 1 */

    var card = elements.create("card", { style: style });
    // Stripe injects an iframe into the DOM
    card.mount("#card-element");

    card.on("change", function (event) {
      // Disable the Pay button if there are no card details in the Element
      document.querySelector("button").disabled = event.empty;
      document.querySelector("#card-error").textContent = event.error
        ? event.error.message
        : "";
    });

    var form = document.getElementById("payment-form");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      // Complete payment when the submit button is clicked
      payWithCard(stripe, card, data.clientSecret);
    });
  });

// Calls stripe.confirmCardPayment
// If the card requires authentication Stripe shows a pop-up modal to
// prompt the user to enter authentication details without leaving your page.
var payWithCard = function (stripe, card, clientSecret) {
  loading(true);
  stripe
    .confirmCardPayment(clientSecret, {
      payment_method: {
        card: card,
      },
    })
    .then(function (result) {
      if (result.error) {
        // Show error to your customer
        showError(result.error.message);
      } else {
        // The payment succeeded!
        orderComplete(result.paymentIntent.id);
      }
    });
};

/* ------- UI helpers ------- */

// Shows a success message when the payment is complete
var orderComplete = function (paymentIntentId) {
  loading(false);
  document
    .querySelector(".result-message a")
    .setAttribute(
      "href",
      "https://dashboard.stripe.com/test/payments/" + paymentIntentId
    );
  document.querySelector(".result-message").classList.remove("hidden");
  document.querySelector("button").disabled = true;
};

// Show the customer the error from Stripe if their card fails to charge
var showError = function (errorMsgText) {
  loading(false);
  var errorMsg = document.querySelector("#card-error");
  errorMsg.textContent = errorMsgText;
  setTimeout(function () {
    errorMsg.textContent = "";
  }, 4000);
};

// Show a spinner on payment submission
var loading = function (isLoading) {
  if (isLoading) {
    // Disable the button and show a spinner
    document.querySelector("button").disabled = true;
    document.querySelector("#spinner").classList.remove("hidden");
    document.querySelector("#button-text").classList.add("hidden");
  } else {
    document.querySelector("button").disabled = false;
    document.querySelector("#spinner").classList.add("hidden");
    document.querySelector("#button-text").classList.remove("hidden");
  }
};

/************** COMMENTS ***************

***NOTE: The frontend sends a request to your server (/stripe) with details about the purchase, including the items to purchase, the total amount, and the shipping fee.
the server processes this request and communicates with Stripe (using a secret API key) to generate a clientSecret for the payment. This clientSecret is a one-time token that authorizes a specific payment amount. The clientSecret is then sent back to the frontend.
Once the frontend receives the clientSecret, it initializes Stripe Elements, which are customizable UI components provided by Stripe for securely collecting payment information.
When the customer submits the payment form, an event listener triggers a function (payWithCard) that uses the clientSecret and the Stripe.js library to securely process the payment with Stripe.
Handling Payment Confirmation: After the payment is processed by the frontend, Stripe sends a confirmation to your server. This confirmation typically includes information about the payment's success or failure. if the payment is successful, the server might update the order status, send a confirmation email to the customer, and initiate order fulfillment. If the payment fails, the server might handle error handling and inform the customer accordingly.

***1: We define a JavaScript object named style that contains styling configurations for the Stripe card element.
The base object within style is where you define the base styles for the card element, such as color, font family, font smoothing, font size, and placeholder color.
The invalid object within style is where you define styles for when the card element is in an invalid state, such as when the user enters incorrect card information.

We use elements.create("card", { style: style }) to create a new card element.
The first parameter "card" specifies the type of Stripe element to create, in this case, a card element for collecting card details.
The second parameter is an object containing options for configuring the element. Here, we pass the style object we defined earlier to apply custom styling to the card element.

After creating the card element, we use card.mount("#card-element") to mount the element onto a specific DOM element with the ID "card-element".
Stripe will inject an iframe into the DOM at the specified location, containing the card element.
This allows users to input their card details securely within the iframe, managed by Stripe.

***2: the data parameter in the .then() function represents the response data obtained from the server. Since this data is coming from your backend, its structure and properties depend entirely on what your backend server sends in response to the request made to "/stripe".
However, assuming a typical integration with Stripe, data likely contains information related to the payment process, such as a client secret required for confirming the payment with Stripe.
Here's an example structure of what data might look like:

{
  "clientSecret": "pi_1A2BC3DEFghiJKL4M5n6op7qr",
  "someOtherData": "value"
}

*/
