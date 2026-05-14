import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Sidebar & Navigation
      "Dashboard": "Dashboard",
      "Inventory": "Inventory",
      "Warehouses": "Warehouses",
      "Transfers": "Transfers",
      "Catalog": "Catalog",
      "Suppliers": "Suppliers",
      "Purchases": "Purchases",
      "Sales": "Sales",
      "Point of Sale": "Point of Sale",
      "Admin SaaS": "Admin SaaS",
      "Users": "Users",
      "Settings": "Settings",
      "Logout": "Logout",
      "Language": "Language",
      "Spanish": "Spanish",
      "English": "English",
      "Exchange Rate History": "Exchange Rate History",
      "Close": "Close",
      
      // Dashboard
      "Welcome": "Welcome",
      "Total Sales": "Total Sales",
      "Active Companies": "Active Companies",
      "Global Metrics": "Global Metrics",
      "Total Revenue": "Total Revenue",
      "Stock Alerts": "Stock Alerts",
      "Sales Last 7 Days": "Sales Last 7 Days",
      "Mon": "Mon", "Tue": "Tue", "Wed": "Wed", "Thu": "Thu", "Fri": "Fri", "Sat": "Sat", "Sun": "Sun",
      
      // Admin SaaS
      "SaaS Admin Control": "SaaS Admin Control",
      "Global oversight of all companies": "Global oversight of all companies",
      "New Client": "New Client",
      "Total Companies": "Total Companies",
      "Active Users": "Active Users",
      "Expiring Soon": "Expiring Soon",
      "Growth": "Growth",
      "Company": "Company",
      "License Key": "License Key",
      "Expiration": "Expiration",
      "Status": "Status",
      "Actions": "Actions",
      "Active": "Active",
      "Suspended": "Suspended",
      "Renew": "Renew",
      "Add New Client Company": "Add New Client Company",
      "Company Name": "Company Name",
      "Contact Email": "Contact Email",
      "Tax ID": "Tax ID",
      
      // WMS & Inventory
      "Manage physical storage locations": "Manage physical storage locations",
      "Add Warehouse": "Add Warehouse",
      "Warehouse Name": "Warehouse Name",
      "Physical Address": "Physical Address",
      "Bin Locations": "Bin Locations",
      "Add Bin": "Add Bin",
      "Bin Code": "Bin Code",
      "Zone": "Zone",
      "Print QR Label": "Print QR Label",
      "Description": "Description",
      "No address set": "No address set",
      "General Zone": "General Zone",
      
      // POS & Sales
      "Search products": "Search products",
      "Add to Cart": "Add to Cart",
      "Cart": "Cart",
      "Total": "Total",
      "Complete Sale": "Complete Sale",
      "Customer": "Customer",
      "Quantity": "Quantity",
      "Price": "Price",
      "Product": "Product",
      "Discount": "Discount",
      "Subtotal": "Subtotal",
      "Tax": "Tax",
      "Sale completed successfully!": "Sale completed successfully!",
      
      // Messages & Warnings
      "Your license expires in": "Your license expires in",
      "days. Please renew to avoid service interruption.": "days. Please renew to avoid service interruption.",
      "Your license has expired. Please contact support to renew.": "Your license has expired. Please contact support to renew.",
      "Are you sure?": "Are you sure?",
      "Success": "Success",
      "Error": "Error",
      "Cancel": "Cancel",
      "Create": "Create",

      // Settings Page
      "Company Settings": "Company Settings",
      "Manage your company profile and invoice details": "Manage your company profile and invoice details",
      "Settings saved successfully": "Settings saved successfully!",
      "General Information": "General Information",
      "Tax ID (RIF / NIT)": "Tax ID (RIF / NIT)",
      "Phone": "Phone",
      "Business Address": "Business Address",
      "Save Changes": "Save Changes",
      "Company Logo": "Company Logo",
      "Logo URL": "Logo URL",
      "Upload Logo": "Upload New Logo",
      "Recommended size: 512x512px. PNG or JPG.": "Recommended size: 512x512px. PNG or JPG.",
      "Create Company": "Create Company",
      "Orders": "Orders",
      "Products": "Products"
    }
  },
  es: {
    translation: {
      // Sidebar & Navigation
      "Dashboard": "Tablero",
      "Inventory": "Inventario",
      "Warehouses": "Almacenes",
      "Transfers": "Transferencias",
      "Catalog": "Catálogo",
      "Suppliers": "Proveedores",
      "Purchases": "Compras",
      "Sales": "Ventas",
      "Point of Sale": "Punto de Venta (POS)",
      "Admin SaaS": "Admin SaaS",
      "Users": "Usuarios",
      "Settings": "Configuración",
      "Logout": "Cerrar Sesión",
      "Language": "Idioma",
      "Spanish": "Español",
      "English": "Inglés",
      "Exchange Rate History": "Historial de Tasas",
      "Close": "Cerrar",

      // Dashboard
      "Welcome": "Bienvenido",
      "Total Sales": "Ventas Totales",
      "Active Companies": "Empresas Activas",
      "Global Metrics": "Métricas Globales",
      "Total Revenue": "Ingresos Totales",
      "Stock Alerts": "Alertas de Stock",
      "Sales Last 7 Days": "Ventas últimos 7 días",
      "Mon": "Lun", "Tue": "Mar", "Wed": "Mie", "Thu": "Jue", "Fri": "Vie", "Sat": "Sab", "Sun": "Dom",

      // Admin SaaS
      "SaaS Admin Control": "Control Administrativo SaaS",
      "Global oversight of all companies": "Supervisión global de todas las empresas",
      "New Client": "Nuevo Cliente",
      "Total Companies": "Total de Empresas",
      "Active Users": "Usuarios Activos",
      "Expiring Soon": "Próximos a Vencer",
      "Growth": "Crecimiento",
      "Company": "Empresa",
      "License Key": "Clave de Licencia",
      "Expiration": "Vencimiento",
      "Status": "Estado",
      "Actions": "Acciones",
      "Active": "Activa",
      "Suspended": "Suspendida",
      "Renew": "Renovar",
      "Add New Client Company": "Agregar Nueva Empresa Cliente",
      "Company Name": "Nombre de la Empresa",
      "Contact Email": "Correo de Contacto",
      "Tax ID": "Identificación Fiscal",

      // WMS & Inventory
      "Manage physical storage locations": "Gestión de ubicaciones físicas de almacenamiento",
      "Add Warehouse": "Agregar Almacén",
      "Warehouse Name": "Nombre del Almacén",
      "Physical Address": "Dirección Física",
      "Bin Locations": "Ubicaciones (Bins)",
      "Add Bin": "Agregar Ubicación",
      "Bin Code": "Código de Ubicación",
      "Zone": "Zona",
      "Print QR Label": "Imprimir Etiqueta QR",
      "Description": "Descripción",
      "No address set": "Sin dirección",
      "General Zone": "Zona General",

      // POS & Sales
      "Search products": "Buscar productos",
      "Add to Cart": "Agregar al Carrito",
      "Cart": "Carrito",
      "Total": "Total",
      "Complete Sale": "Completar Venta",
      "Customer": "Cliente",
      "Quantity": "Cantidad",
      "Price": "Precio",
      "Product": "Producto",
      "Discount": "Descuento",
      "Subtotal": "Subtotal",
      "Tax": "Impuesto",
      "Sale completed successfully!": "¡Venta completada con éxito!",

      // Messages & Warnings
      "Your license expires in": "Tu licencia vence en",
      "days. Please renew to avoid service interruption.": "días. Por favor renueva para evitar interrupciones.",
      "Your license has expired. Please contact support to renew.": "Tu licencia ha vencido. Contacta a soporte para renovar.",
      "Are you sure?": "¿Estás seguro?",
      "Success": "Éxito",
      "Error": "Error",
      "Cancel": "Cancelar",
      "Create": "Crear",

      // Settings Page
      "Company Settings": "Configuración de la Empresa",
      "Manage your company profile and invoice details": "Administra el perfil de tu empresa y datos de facturación",
      "Settings saved successfully": "¡Configuración guardada con éxito!",
      "General Information": "Información General",
      "Tax ID (RIF / NIT)": "RIF / NIT",
      "Phone": "Teléfono",
      "Business Address": "Dirección Comercial",
      "Save Changes": "Guardar Cambios",
      "Company Logo": "Logo de la Empresa",
      "Logo URL": "URL del Logo",
      "Upload Logo": "Subir Logo",
      "Recommended size: 512x512px. PNG or JPG.": "Tamaño recomendado: 512x512px. PNG o JPG.",
      "Create Company": "Crear Empresa",
      "Orders": "Pedidos",
      "Products": "Productos"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: "es", // Forced default language
    fallbackLng: "es", // Forced fallback
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
