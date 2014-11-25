angular.module('ngStorekit', [])

/* global storekit */

/**
 * 'storekit' is a global variable provided by the cordova plugin https://github.com/j3k0/PhoneGap-InAppPurchase-iOS
 * for installation instructions see https://github.com/j3k0/PhoneGap-InAppPurchase-iOS/blob/master/README.md
 */

.factory('$storekit', function($q,$http) {

    /**
     * @var {Array}
     */
    var _productIds = [];

    /**
     * @var {Array}
     */
    var _products = [];

    /**
     * @var {Bool}
     */
    var _debug = true;

    /**
     * @var {Object}
     */
    var _storekit;

    /**
     * @var {Object}
     */
    var fakeStorekit = {};

    /**
     * @var {Object}
     */
    var $storekit = {};

    /**
     *
     */
    var _onPurchase;

    /**
     *
     */
    var _onRestore;

    /**
     *
     */
    var _onError;

    /**
     *
     * @param {String} productId
     */
    fakeStorekit.purchase = function (productId) {
        window.setTimeout(function () {
            _onPurchase('', productId);
        }, 300);
    };

    /**
     *
     */
    fakeStorekit.restore = function () {
        _productIds.forEach(function (el) {
            _onRestore('', el);
        });
    };

    fakeStorekit.loadReceipts = function() {
        var callCallback = function() {

        };

        return callCallback;
    };

    /**
     *
     */
    fakeStorekit.finish = function (transactionId) {

    };

    /**
     * 
     * @param {Bool}
     * @return {Object}
     */
    $storekit.setLogging = function (debug) {
        _debug = debug;
        return this;
    };

    /**
     *
     * @param {String} productId
     */
    $storekit.purchase = function (productId) {
        _storekit.purchase(productId);
    };

    /**
     *
     */
    $storekit.restore = function () {
        _storekit.restore();
    };


    /**
     * iOS < 7
     */
    $storekit.loadReceiptForTransaction = function(transactionId) {
        var deferred = $q.defer();

        _storekit.loadReceipts(function (receipts) {
            deferred.resolve(receipts.forTransaction(transactionId));
        });

        return deferred.promise;
    };

    /**
     * iOS < 7
     */
    $storekit.loadReceiptForProduct = function(productId){
        var deferred = $q.defer();

        _storekit.loadReceipts(function(receipts){
            deferred.resolve(receipts.forProduct(productId));
        });

        return deferred.promise;
    };

    /**
     * iOS >= 7
     */
    $storekit.loadAppStoreReceipt = function(){
        var deferred = $q.defer();

        _storekit.loadReceipts(function(receipts){
            deferred.resolve(receipts.appStoreReceipt);
        });

        return deferred.promise;
    };

    /**
     *
     */
    $storekit.validateReceipt = function(receipt,isSandbox){
        var deferred = $q.defer();
        var url = 'https://buy.itunes.apple.com/verifyReceipt';

        if( isSandbox ){
            url = 'https://sandbox.itunes.apple.com/verifyReceipt';
        }

        $http.post(url,receipt)
            .success(function(response){
                deferred.resolve(response);
            }).error(function(error){
                deferred.reject(error);
            });

        return deferred.promise;
    };

    /**
     *
     */
    $storekit.finish = function (transactionId) {
        _storekit.finish(transactionId);
    };

    /**
     * @return {Promise}
     */
    $storekit.watchPurchases = function () {
        var deferred = $q.defer();
        var purchase = {};
        _onRestore = function (transactionId, productId) {
            purchase = {
                transactionId      : transactionId,
                productId          : productId,
                type               : 'restore'
            };
            deferred.notify(purchase);
        };
        _onPurchase = function (transactionId, productId) {
            purchase = {
                transactionId      : transactionId,
                productId          : productId,
                type               : 'purchase'
            };
            deferred.notify(purchase);
        };
        /**
         * List of error codes:
         * https://github.com/j3k0/PhoneGap-InAppPurchase-iOS/blob/master/README.md#documentation
         */
        _onError = function (errorCode, errorMessage) {
            deferred.reject('Error ' + errorCode + ':' + errorMessage);
        };
        return deferred.promise;
    };

    /**
     *
     * @return {Array}
     */
    $storekit.getProducts = function () {
        // TODO: make sure webkit and the products already loaded
        return _products;
    };

    /**
     * @param {Array}
     */
    $storekit.load = function (productIds) {
        // check platform and exit if not iOS
        var isDevice = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(navigator.userAgent);
        _productIds = productIds;
        var deferred = $q.defer();
        if (!window.storekit || !isDevice) {
            if (_debug) {
                console.log("In-App Purchases not available - Using a fake object to emulate in app purchases");
                products = [];
                _productIds.forEach(function (el) {
                    products.push({id : el, price : '$999'});
                });
                _storekit = fakeStorekit;
                _products = products;
                deferred.resolve(products);
            } else {
                deferred.reject('In-App Purchases not available');
            }
        } else {
            storekit.init({
                debug : _debug, // Enable IAP messages on the console
                ready : function () {
                    storekit.load(_productIds, function (products, invalidIds) {
                        _products = products;
                        if (invalidIds.length && _debug) {
                            for (var i = 0; i < invalidIds.length; ++i) {
                                console.log("Error: could not load " + invalidIds[i]);
                            }
                        }
                        if (products.length) {
                            deferred.resolve(products);
                        } else {
                            deferred.reject();
                        }
                    });
                },
                purchase : function (transactionId, productId) {
                    _onPurchase(transactionId, productId);
                },
                restore : function (transactionId, productId) {
                    _onRestore(transactionId, productId);
                },
                error : function (errorCode, errorMessage) {
                    _onError(errorCode, errorMessage);
                }
            });
            _storekit = storekit;
        }
        return deferred.promise;
    };


    return $storekit;


});
