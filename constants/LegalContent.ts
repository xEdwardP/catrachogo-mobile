export type LegalDocId = 'terms' | 'privacy' | 'licenses';

export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDocument {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: Record<LegalDocId, LegalDocument> = {
  terms: {
    title: 'Términos de uso',
    updatedAt: '23 de julio de 2026',
    sections: [
      {
        heading: '1. Aceptación de los términos',
        body: [
          'Al crear una cuenta o usar CatrachoGo, aceptas estos términos de uso. Si no estás de acuerdo con alguna parte, no debes usar la plataforma.',
        ],
      },
      {
        heading: '2. Qué es CatrachoGo',
        body: [
          'CatrachoGo es una plataforma tecnológica que conecta pasajeros con conductores independientes dentro de Honduras. No somos una empresa de transporte: los conductores prestan el servicio de traslado de forma independiente, y CatrachoGo actúa como intermediario que facilita la solicitud, el cobro y el seguimiento del viaje.',
        ],
      },
      {
        heading: '3. Cuentas de usuario',
        body: [
          'Debes proporcionar información veraz al registrarte (nombre, correo y teléfono). Un número de teléfono verificado es obligatorio para poder solicitar un viaje.',
          'Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad que ocurra en tu cuenta.',
        ],
      },
      {
        heading: '4. Wallet y pagos',
        body: [
          'Los viajes se cobran desde tu wallet de CatrachoGo. Puedes recargarla mediante PayPal. Antes de confirmar un viaje, se te muestra la tarifa estimada; necesitas saldo suficiente para cubrirla.',
          'Los conductores reciben sus ganancias en su propia wallet y pueden solicitar el retiro hacia su cuenta de PayPal.',
        ],
      },
      {
        heading: '5. Cancelaciones y viajes no completados',
        body: [
          'Cancelar un viaje mientras todavía se busca conductor no tiene costo. Si cancelas después de que un conductor ya fue asignado, se aplica un cargo fijo como compensación para el conductor.',
          'Si el conductor llega al punto de recogida y el pasajero no se presenta tras un periodo de espera razonable, el conductor puede reportar la no presentación y se aplica el mismo tipo de cargo.',
          'El pasajero puede finalizar un viaje antes de llegar al destino original; en ese caso se cobra una tarifa proporcional a la distancia realmente recorrida, no la tarifa completa estimada.',
        ],
      },
      {
        heading: '6. Conducta esperada',
        body: [
          'Se espera un trato respetuoso entre pasajeros y conductores. No se tolera el acoso, la discriminación ni la conducta violenta.',
          'Cualquier usuario puede reportar un problema o una situación irregular ocurrida durante un viaje; el equipo de CatrachoGo revisa cada reporte manualmente.',
        ],
      },
      {
        heading: '7. Verificación de conductores',
        body: [
          'Los conductores deben registrar su información y documentos (identificación, licencia, documentos del vehículo) para que un administrador de CatrachoGo los revise y apruebe antes de poder conectarse a recibir viajes.',
        ],
      },
      {
        heading: '8. Limitación de responsabilidad',
        body: [
          'CatrachoGo facilita la conexión entre pasajeros y conductores, pero no controla directamente la conducción del vehículo. En la medida permitida por la ley, CatrachoGo no es responsable por incidentes ocurridos durante el traslado físico, sin perjuicio de las herramientas de reporte y revisión disponibles en la plataforma.',
        ],
      },
      {
        heading: '9. Cambios a estos términos',
        body: [
          'Podemos actualizar estos términos ocasionalmente. Si los cambios son significativos, te lo notificaremos dentro de la aplicación.',
        ],
      },
      {
        heading: '10. Contacto',
        body: [
          'Si tienes dudas sobre estos términos, puedes escribirnos desde la sección de Soporte de la aplicación.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Política de privacidad',
    updatedAt: '23 de julio de 2026',
    sections: [
      {
        heading: '1. Qué datos recopilamos',
        body: [
          'Datos de cuenta: nombre, correo electrónico y número de teléfono.',
          'Datos de conductor: documentos de identificación, licencia, información del vehículo y una foto de verificación, usados únicamente para el proceso de aprobación.',
          'Datos de ubicación: la ubicación del conductor se registra durante un viaje activo para calcular tarifas, mostrar el mapa y permitir el seguimiento en tiempo real.',
          'Datos de uso: historial de viajes, transacciones de wallet y reportes que envíes.',
        ],
      },
      {
        heading: '2. Para qué usamos tus datos',
        body: [
          'Conectar pasajeros con conductores disponibles, calcular tarifas, procesar pagos, brindar soporte, y revisar reportes de incidencias.',
          'No usamos tus datos para publicidad de terceros ni los vendemos a otras empresas.',
        ],
      },
      {
        heading: '3. Con quién compartimos información',
        body: [
          'Con PayPal, para procesar recargas y retiros de wallet.',
          'Con Cloudinary, para almacenar de forma segura las fotos de perfil y documentos de conductor.',
          'Con Google Maps Platform, para geocodificación de direcciones y cálculo de rutas.',
          'El teléfono del conductor o pasajero solo se revela a la otra parte del viaje mientras este está aceptado o en curso — nunca antes ni después.',
        ],
      },
      {
        heading: '4. Seguridad',
        body: [
          'Las contraseñas se almacenan cifradas y nunca en texto plano. El acceso a la plataforma requiere autenticación mediante token.',
        ],
      },
      {
        heading: '5. Retención de datos',
        body: [
          'Conservamos tu información mientras tu cuenta esté activa. Puedes solicitar la eliminación de tu cuenta escribiendo a soporte.',
        ],
      },
      {
        heading: '6. Tus derechos',
        body: [
          'Puedes acceder, corregir o solicitar la eliminación de tus datos personales en cualquier momento, sujeto a las obligaciones legales y financieras pendientes (por ejemplo, historial de transacciones).',
        ],
      },
      {
        heading: '7. Contacto',
        body: [
          'Para cualquier consulta sobre privacidad, escríbenos desde la sección de Soporte de la aplicación.',
        ],
      },
    ],
  },
  licenses: {
    title: 'Licencias',
    updatedAt: '23 de julio de 2026',
    sections: [
      {
        heading: 'Software de código abierto',
        body: [
          'CatrachoGo está construido con las siguientes librerías y herramientas de código abierto. Agradecemos a sus comunidades de mantenimiento.',
        ],
      },
      {
        heading: 'React Native y Expo',
        body: [
          'Framework de aplicaciones nativas y plataforma de desarrollo sobre la que está construida la app. Licencia MIT.',
        ],
      },
      {
        heading: 'Expo Router',
        body: ['Navegación basada en archivos usada en toda la aplicación. Licencia MIT.'],
      },
      {
        heading: 'react-native-maps',
        body: [
          'Componente de mapas nativos usado para el seguimiento de viajes y rutas. Licencia MIT.',
        ],
      },
      {
        heading: 'React Native Reanimated y Gesture Handler',
        body: ['Animaciones y manejo de gestos nativos. Licencia MIT.'],
      },
      {
        heading: '@gorhom/bottom-sheet',
        body: ['Paneles inferiores deslizables usados al solicitar un viaje. Licencia MIT.'],
      },
      {
        heading: 'Axios',
        body: ['Cliente HTTP usado para comunicarnos con el backend. Licencia MIT.'],
      },
      {
        heading: 'Módulos de Expo',
        body: [
          'expo-location para la ubicación durante los viajes, expo-image-picker para tomar o elegir fotos, expo-secure-store para guardar tu sesión de forma cifrada en el dispositivo, y expo-web-browser para el checkout de PayPal. Licencia MIT.',
        ],
      },
      {
        heading: 'Servicios de terceros',
        body: [
          'Google Maps Platform — mapas, autocompletado de direcciones y cálculo de rutas.',
          'PayPal — procesamiento de pagos para recargas y retiros de wallet.',
          'Cloudinary — almacenamiento de imágenes de perfil y documentos de conductor.',
        ],
      },
    ],
  },
};
