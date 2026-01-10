<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\Admin\RoleController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\References\UnitController;
use App\Http\Controllers\Api\References\CounterpartyTypeController;
use App\Http\Controllers\Api\References\CounterpartyController;
use App\Http\Controllers\Api\References\WarehouseController;
use App\Http\Controllers\Api\References\CashRegisterController;
use App\Http\Controllers\Api\References\ProductTypeController;
use App\Http\Controllers\Api\References\ProductController;
use App\Http\Controllers\Api\References\CurrencyController;
use App\Http\Controllers\Api\References\PartnerController;
use App\Http\Controllers\Api\Accounting\TransactionController;
use App\Http\Controllers\Api\Accounting\CashController;
use App\Http\Controllers\Api\Accounting\StockController;
use App\Http\Controllers\Api\Accounting\CounterpartyBalanceController;
use App\Http\Controllers\Api\Accounting\DividendController;
use App\Http\Controllers\Api\Accounting\SalaryController;
use App\Http\Controllers\Api\Production\RecipeController;
use App\Http\Controllers\Api\Production\ProductionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Google OAuth routes
Route::get('/auth/google', [GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);
Route::post('/auth/google/mobile', [GoogleAuthController::class, 'mobileCallback']);

// Protected routes
Route::middleware(['auth:sanctum', 'activity'])->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard
    Route::get('/dashboard', [\App\Http\Controllers\Api\DashboardController::class, 'index']);

    // Profile routes
    Route::prefix('profile')->group(function () {
        Route::post('/change-password', [\App\Http\Controllers\Api\ProfileController::class, 'changePassword']);
    });

    // Admin routes
    Route::prefix('admin')->group(function () {
        // Roles management
        Route::middleware('permission:admin.roles.view')->group(function () {
            Route::get('/roles', [RoleController::class, 'index']);
            Route::get('/roles/{role}', [RoleController::class, 'show']);
            Route::get('/permissions', [RoleController::class, 'permissions']);
        });

        Route::middleware('permission:admin.roles.create')->group(function () {
            Route::post('/roles', [RoleController::class, 'store']);
        });

        Route::middleware('permission:admin.roles.edit')->group(function () {
            Route::put('/roles/{role}', [RoleController::class, 'update']);
        });

        Route::middleware('permission:admin.roles.delete')->group(function () {
            Route::delete('/roles/{role}', [RoleController::class, 'destroy']);
        });

        // Users management
        Route::middleware('permission:admin.users.view')->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::get('/users/roles', [UserController::class, 'roles']);
            Route::get('/users/{user}', [UserController::class, 'show']);
        });

        Route::middleware('permission:admin.users.create')->group(function () {
            Route::post('/users', [UserController::class, 'store']);
        });

        Route::middleware('permission:admin.users.edit')->group(function () {
            Route::put('/users/{user}', [UserController::class, 'update']);
            Route::patch('/users/{user}/role', [UserController::class, 'assignRole']);
        });

        Route::middleware('permission:admin.users.delete')->group(function () {
            Route::delete('/users/{user}', [UserController::class, 'destroy']);
        });
    });

    // References routes (Справочники)
    Route::prefix('references')->group(function () {
        // Units (Единицы измерения)
        Route::middleware('permission:references.units.view')->group(function () {
            Route::get('/units', [UnitController::class, 'index']);
            Route::get('/units/{unit}', [UnitController::class, 'show']);
        });
        Route::middleware('permission:references.units.create')->post('/units', [UnitController::class, 'store']);
        Route::middleware('permission:references.units.edit')->put('/units/{unit}', [UnitController::class, 'update']);
        Route::middleware('permission:references.units.delete')->delete('/units/{unit}', [UnitController::class, 'destroy']);

        // Currencies (Валюты)
        Route::middleware('permission:references.currencies.view')->group(function () {
            Route::get('/currencies', [CurrencyController::class, 'index']);
            Route::get('/currencies/{currency}', [CurrencyController::class, 'show']);
        });
        Route::middleware('permission:references.currencies.create')->post('/currencies', [CurrencyController::class, 'store']);
        Route::middleware('permission:references.currencies.edit')->put('/currencies/{currency}', [CurrencyController::class, 'update']);
        Route::middleware('permission:references.currencies.delete')->delete('/currencies/{currency}', [CurrencyController::class, 'destroy']);

        // Counterparty Types (Типы контрагентов)
        Route::middleware('permission:references.counterparty_types.view')->group(function () {
            Route::get('/counterparty-types', [CounterpartyTypeController::class, 'index']);
            Route::get('/counterparty-types/{counterpartyType}', [CounterpartyTypeController::class, 'show']);
        });
        Route::middleware('permission:references.counterparty_types.create')->post('/counterparty-types', [CounterpartyTypeController::class, 'store']);
        Route::middleware('permission:references.counterparty_types.edit')->put('/counterparty-types/{counterpartyType}', [CounterpartyTypeController::class, 'update']);
        Route::middleware('permission:references.counterparty_types.delete')->delete('/counterparty-types/{counterpartyType}', [CounterpartyTypeController::class, 'destroy']);

        // Counterparties (Контрагенты)
        Route::middleware('permission:references.counterparties.view')->group(function () {
            Route::get('/counterparties', [CounterpartyController::class, 'index']);
            Route::get('/counterparties/{counterparty}', [CounterpartyController::class, 'show']);
        });
        Route::middleware('permission:references.counterparties.create')->post('/counterparties', [CounterpartyController::class, 'store']);
        Route::middleware('permission:references.counterparties.edit')->put('/counterparties/{counterparty}', [CounterpartyController::class, 'update']);
        Route::middleware('permission:references.counterparties.delete')->delete('/counterparties/{counterparty}', [CounterpartyController::class, 'destroy']);

        // Warehouses (Склады)
        Route::middleware('permission:references.warehouses.view')->group(function () {
            Route::get('/warehouses', [WarehouseController::class, 'index']);
            Route::get('/warehouses/{warehouse}', [WarehouseController::class, 'show']);
        });
        Route::middleware('permission:references.warehouses.create')->post('/warehouses', [WarehouseController::class, 'store']);
        Route::middleware('permission:references.warehouses.edit')->put('/warehouses/{warehouse}', [WarehouseController::class, 'update']);
        Route::middleware('permission:references.warehouses.delete')->delete('/warehouses/{warehouse}', [WarehouseController::class, 'destroy']);

        // Cash Registers (Кассы)
        Route::middleware('permission:references.cash_registers.view')->group(function () {
            Route::get('/cash-registers', [CashRegisterController::class, 'index']);
            Route::get('/cash-registers/types', [CashRegisterController::class, 'types']);
            Route::get('/cash-registers/{cashRegister}', [CashRegisterController::class, 'show']);
        });
        Route::middleware('permission:references.cash_registers.create')->post('/cash-registers', [CashRegisterController::class, 'store']);
        Route::middleware('permission:references.cash_registers.edit')->put('/cash-registers/{cashRegister}', [CashRegisterController::class, 'update']);
        Route::middleware('permission:references.cash_registers.delete')->delete('/cash-registers/{cashRegister}', [CashRegisterController::class, 'destroy']);

        // Product Types (Типы товаров)
        Route::middleware('permission:references.product_types.view')->group(function () {
            Route::get('/product-types', [ProductTypeController::class, 'index']);
            Route::get('/product-types/{productType}', [ProductTypeController::class, 'show']);
        });
        Route::middleware('permission:references.product_types.create')->post('/product-types', [ProductTypeController::class, 'store']);
        Route::middleware('permission:references.product_types.edit')->put('/product-types/{productType}', [ProductTypeController::class, 'update']);
        Route::middleware('permission:references.product_types.delete')->delete('/product-types/{productType}', [ProductTypeController::class, 'destroy']);

        // Products (Товары)
        Route::middleware('permission:references.products.view')->group(function () {
            Route::get('/products', [ProductController::class, 'index']);
            Route::get('/products/{product}', [ProductController::class, 'show']);
        });
        Route::middleware('permission:references.products.create')->post('/products', [ProductController::class, 'store']);
        Route::middleware('permission:references.products.edit')->put('/products/{product}', [ProductController::class, 'update']);
        Route::middleware('permission:references.products.delete')->delete('/products/{product}', [ProductController::class, 'destroy']);

        // Partners (Компаньоны)
        Route::middleware('permission:references.partners.view')->group(function () {
            Route::get('/partners', [PartnerController::class, 'index']);
            Route::get('/partners/{partner}', [PartnerController::class, 'show']);
        });
        Route::middleware('permission:references.partners.create')->post('/partners', [PartnerController::class, 'store']);
        Route::middleware('permission:references.partners.edit')->put('/partners/{partner}', [PartnerController::class, 'update']);
        Route::middleware('permission:references.partners.delete')->delete('/partners/{partner}', [PartnerController::class, 'destroy']);
    });

    // Accounting routes (Бухгалтерия)
    Route::prefix('accounting')->group(function () {
        // Transactions (Движения)
        Route::get('/transactions/types', [TransactionController::class, 'types']);
        
        Route::middleware('permission:accounting.transactions.view')->group(function () {
            Route::get('/transactions', [TransactionController::class, 'index']);
            Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
        });
        Route::middleware('permission:accounting.transactions.create')->post('/transactions', [TransactionController::class, 'store']);
        Route::middleware('permission:accounting.transactions.edit')->put('/transactions/{transaction}', [TransactionController::class, 'update']);
        Route::middleware('permission:accounting.transactions.delete')->delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);
        Route::middleware('permission:accounting.transactions.confirm')->post('/transactions/{transaction}/confirm', [TransactionController::class, 'confirm']);
        Route::middleware('permission:accounting.transactions.cancel')->post('/transactions/{transaction}/cancel', [TransactionController::class, 'cancel']);

        // Cash (Касса - просмотр)
        Route::middleware('permission:accounting.cash.view')->group(function () {
            Route::get('/cash/balances', [CashController::class, 'balances']);
            Route::get('/cash/movements', [CashController::class, 'movements']);
            Route::get('/cash/summary', [CashController::class, 'summary']);
        });

        // Stock (Склад - просмотр)
        Route::middleware('permission:accounting.stock.view')->group(function () {
            Route::get('/stock/balances', [StockController::class, 'balances']);
            Route::get('/stock/movements', [StockController::class, 'movements']);
            Route::get('/stock/summary', [StockController::class, 'summary']);
        });

        // Counterparties (Контрагенты - просмотр взаиморасчётов)
        Route::middleware('permission:accounting.counterparties.view')->group(function () {
            Route::get('/counterparties/balances', [CounterpartyBalanceController::class, 'balances']);
            Route::get('/counterparties/movements', [CounterpartyBalanceController::class, 'movements']);
            Route::get('/counterparties/summary', [CounterpartyBalanceController::class, 'summary']);
        });

        // Dividends (Дивиденды - просмотр)
        Route::middleware('permission:accounting.dividends.view')->group(function () {
            Route::get('/dividends/balances', [DividendController::class, 'balances']);
            Route::get('/dividends/movements', [DividendController::class, 'movements']);
            Route::get('/dividends/summary', [DividendController::class, 'summary']);
            Route::post('/dividends/calculate', [DividendController::class, 'calculate']);
        });

        // Salary (Зарплата)
        Route::middleware('permission:accounting.salary.view')->group(function () {
            Route::get('/salary/balances', [SalaryController::class, 'balances']);
            Route::get('/salary/movements', [SalaryController::class, 'movements']);
            Route::get('/salary/summary', [SalaryController::class, 'summary']);
        });
    });

    // Production routes (Производство)
    Route::prefix('production')->group(function () {
        // Recipes (Рецепты)
        Route::middleware('permission:production.recipes.view')->group(function () {
            Route::get('/recipes', [RecipeController::class, 'index']);
            Route::get('/recipes/{recipe}', [RecipeController::class, 'show']);
        });
        Route::middleware('permission:production.recipes.create')->post('/recipes', [RecipeController::class, 'store']);
        Route::middleware('permission:production.recipes.edit')->put('/recipes/{recipe}', [RecipeController::class, 'update']);
        Route::middleware('permission:production.recipes.delete')->delete('/recipes/{recipe}', [RecipeController::class, 'destroy']);

        // Productions (Производство)
        Route::post('/productions/calculate', [ProductionController::class, 'calculate']); // Расчёт без права
        
        Route::middleware('permission:production.production.view')->group(function () {
            Route::get('/productions', [ProductionController::class, 'index']);
            Route::get('/productions/{production}', [ProductionController::class, 'show']);
        });
        Route::middleware('permission:production.production.create')->post('/productions', [ProductionController::class, 'store']);
        Route::middleware('permission:production.production.edit')->put('/productions/{production}', [ProductionController::class, 'update']);
        Route::middleware('permission:production.production.delete')->delete('/productions/{production}', [ProductionController::class, 'destroy']);
        Route::middleware('permission:production.production.confirm')->post('/productions/{production}/confirm', [ProductionController::class, 'confirm']);
        Route::middleware('permission:production.production.cancel')->post('/productions/{production}/cancel', [ProductionController::class, 'cancel']);
    });
});
