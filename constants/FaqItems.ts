export type FaqItem = {
  question: string;
  answer: string;
};

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Cómo recargo mi wallet?',
    answer:
      'Ve a la pestaña Wallet y usa el botón "Recargar con PayPal". El saldo se refleja de inmediato después de confirmar el pago.',
  },
  {
    question: '¿Por qué necesito saldo antes de pedir un viaje?',
    answer:
      'CatrachoGo cobra la tarifa desde tu wallet al completar el viaje, así que necesitas saldo suficiente para cubrir la tarifa estimada antes de solicitarlo.',
  },
  {
    question: '¿Qué pasa si cancelo un viaje?',
    answer:
      'Cancelar mientras buscas conductor es gratis. Si ya tienes un conductor en camino, se aplica un cargo fijo como compensación para el conductor.',
  },
  {
    question: '¿Cómo me convierto en conductor?',
    answer:
      'Regístrate como conductor y completa tu perfil con tus documentos y los de tu vehículo. Un administrador revisa y aprueba tu cuenta antes de que puedas conectarte a recibir viajes.',
  },
  {
    question: '¿Cuándo puedo ver el teléfono de mi conductor o pasajero?',
    answer:
      'Por seguridad, el número de teléfono solo se muestra una vez que el viaje fue aceptado por un conductor y mientras está en curso.',
  },
  {
    question: '¿Cómo retiro mis ganancias como conductor?',
    answer:
      'Desde la pestaña Wallet, usa el botón "Solicitar retiro" e indica tu correo de PayPal y el monto. Un administrador procesa la solicitud.',
  },
];
