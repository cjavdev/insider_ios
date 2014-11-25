# ng-storekit

AngularJS Cordova wrapper for the iOS Cordova [iOS In App Purchases Plugin](https://github.com/j3k0/PhoneGap-InAppPurchase-iOS)

## Features

 * Easy to use with Ionic or any AngularJS app
 * Returns $q promises
 * Easy testing - emulates in app purchases with fake data when testing in the browser or on an iOS emulator

## Install

Install the cordova [iOS In App Purchases Plugin](https://github.com/j3k0/PhoneGap-InAppPurchase-iOS)

    $ cordova plugin add git://github.com/j3k0/PhoneGap-InAppPurchase-iOS.git

Install ng-storekit with bower

    $ bower install ng-storekit

Include ng-storekit from the bower library

    <script src="bower_components/ng-storekit/src/ng-storekit.js"></script>

## Usage

Include as a dependency in your angular module

```javascript
angular.module('myApp', ['ngStorekit'])
```

Load storekit when the device is ready

```javascript
.run(function($ionicPlatform, $storekit) {
    $ionicPlatform.ready(function() {
        $storekit
            .setLogging(true)
            .load(['com.yourcompany.inapppurchase.id'])
            .then(function (products) {
                console.log('products loaded');
            })
            .catch(function () {
                console.log('no products loaded');
            });
    });
});
```

Make and restore purchases

```javascript
module.controller('MyCtrl', function($scope, $storekit) {

    // get products:
    var products = $storekit.getProducts();
    products.forEach(function (product) {
        console.log(product.productId);
        console.log(product.description);
        console.log(product.price);
    });

    // make a purchase:
    $storekit.purchase('com.yourcompany.inapppurchase.id');

    // restore purchases:
    $storekit.restore();

    // watch for purchases
    $storekit
        .watchPurchases()
        .then(function () {
            // Not currently used
        }, function (error) {
            // An error occured. Show a message to the user
        }, function (purchase) {
            if (purchase.productId === 'com.yourcompany.inapppurchase.id') {
                if (purchase.type === 'purchase') {
                    // Your product was purchased
                } else if (purchase.type === 'restore') {
                    // Your product was restored
                }
                console.log(purchase.transactionId);
                console.log(purchase.productId);
                console.log(purchase.transactionReceipt);

            }
        });

});
 ```

## More

* [In-App Purchase Programming Guide](http://developer.apple.com/library/ios/#documentation/NetworkingInternet/Conceptual/StoreKitGuide/Introduction/Introduction.html)
* A comprehensive tutorial of the [Cordova plugin](http://fovea.cc/blog/index.php/3-steps-tutorial-for-phonegap-in-app-purchase-on-ios/)
* [ng-cordova](https://github.com/driftyco/ng-cordova) - AngularJS Cordova wrappers for common Cordova plugins
* [cordova-icon](https://github.com/AlexDisler/cordova-icon) automates icon resizing for cordova

## License

MIT
