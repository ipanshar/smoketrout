<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'module',
        'description',
    ];

    /**
     * Available modules in the system
     */
    public const MODULES = [
        'admin' => 'Администрирование',
        'references' => 'Справочники',
        'accounting' => 'Бухгалтерия',
        'production' => 'Производство',
        'profile' => 'Личный кабинет',
    ];

    /**
     * Available permissions per module
     */
    public const MODULE_PERMISSIONS = [
        'admin' => [
            'admin.roles.view' => 'Просмотр ролей',
            'admin.roles.create' => 'Создание ролей',
            'admin.roles.edit' => 'Редактирование ролей',
            'admin.roles.delete' => 'Удаление ролей',
            'admin.users.view' => 'Просмотр пользователей',
            'admin.users.create' => 'Создание пользователей',
            'admin.users.edit' => 'Редактирование пользователей',
            'admin.users.delete' => 'Удаление пользователей',
            'admin.settings.view' => 'Просмотр настроек',
            'admin.settings.edit' => 'Редактирование настроек',
        ],
        'references' => [
            'references.currencies.view' => 'Просмотр валют',
            'references.currencies.create' => 'Создание валют',
            'references.currencies.edit' => 'Редактирование валют',
            'references.currencies.delete' => 'Удаление валют',
            'references.counterparties.view' => 'Просмотр контрагентов',
            'references.counterparties.create' => 'Создание контрагентов',
            'references.counterparties.edit' => 'Редактирование контрагентов',
            'references.counterparties.delete' => 'Удаление контрагентов',
            'references.counterparty_types.view' => 'Просмотр типов контрагентов',
            'references.counterparty_types.create' => 'Создание типов контрагентов',
            'references.counterparty_types.edit' => 'Редактирование типов контрагентов',
            'references.counterparty_types.delete' => 'Удаление типов контрагентов',
            'references.warehouses.view' => 'Просмотр складов',
            'references.warehouses.create' => 'Создание складов',
            'references.warehouses.edit' => 'Редактирование складов',
            'references.warehouses.delete' => 'Удаление складов',
            'references.cash_registers.view' => 'Просмотр касс',
            'references.cash_registers.create' => 'Создание касс',
            'references.cash_registers.edit' => 'Редактирование касс',
            'references.cash_registers.delete' => 'Удаление касс',
            'references.products.view' => 'Просмотр товаров',
            'references.products.create' => 'Создание товаров',
            'references.products.edit' => 'Редактирование товаров',
            'references.products.delete' => 'Удаление товаров',
            'references.product_types.view' => 'Просмотр типов товаров',
            'references.product_types.create' => 'Создание типов товаров',
            'references.product_types.edit' => 'Редактирование типов товаров',
            'references.product_types.delete' => 'Удаление типов товаров',
            'references.units.view' => 'Просмотр единиц измерения',
            'references.units.create' => 'Создание единиц измерения',
            'references.units.edit' => 'Редактирование единиц измерения',
            'references.units.delete' => 'Удаление единиц измерения',
            'references.partners.view' => 'Просмотр компаньонов',
            'references.partners.create' => 'Создание компаньонов',
            'references.partners.edit' => 'Редактирование компаньонов',
            'references.partners.delete' => 'Удаление компаньонов',
            'references.services.view' => 'Просмотр услуг',
            'references.services.create' => 'Создание услуг',
            'references.services.edit' => 'Редактирование услуг',
            'references.services.delete' => 'Удаление услуг',
        ],
        'accounting' => [
            // Движения (проводки)
            'accounting.transactions.view' => 'Просмотр движений',
            'accounting.transactions.create' => 'Создание движений',
            'accounting.transactions.edit' => 'Редактирование движений',
            'accounting.transactions.delete' => 'Удаление движений',
            'accounting.transactions.confirm' => 'Проведение движений',
            'accounting.transactions.cancel' => 'Отмена движений',
            // Касса (просмотр)
            'accounting.cash.view' => 'Просмотр кассы',
            // Склад (просмотр)
            'accounting.stock.view' => 'Просмотр склада',
            // Контрагенты (просмотр взаиморасчётов)
            'accounting.counterparties.view' => 'Просмотр взаиморасчётов',
            // Дивиденды (просмотр)
            'accounting.dividends.view' => 'Просмотр дивидендов',
            // Зарплата (просмотр)
            'accounting.salary.view' => 'Просмотр зарплат',
        ],
        'production' => [
            'production.recipes.view' => 'Просмотр рецептов',
            'production.recipes.create' => 'Создание рецептов',
            'production.recipes.edit' => 'Редактирование рецептов',
            'production.recipes.delete' => 'Удаление рецептов',
            'production.production.view' => 'Просмотр производства',
            'production.production.create' => 'Создание производства',
            'production.production.edit' => 'Редактирование производства',
            'production.production.delete' => 'Удаление производства',
            'production.production.confirm' => 'Проведение производства',
            'production.production.cancel' => 'Отмена производства',
        ],
        'profile' => [
            'profile.settings.view' => 'Просмотр настроек аккаунта',
            'profile.settings.edit' => 'Редактирование настроек аккаунта',
        ],
    ];

    /**
     * Roles that have this permission
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permission')
            ->withTimestamps();
    }

    /**
     * Get module display name
     */
    public function getModuleDisplayName(): string
    {
        return self::MODULES[$this->module] ?? $this->module;
    }
}
