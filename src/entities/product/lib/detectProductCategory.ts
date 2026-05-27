export function detectProductCategory(input: { title?: string; description?: string; category?: string }) {
  const text = [input.title, input.description, input.category].filter(Boolean).join(' ').toLowerCase();
  if (/космет|помада|макияж|beauty|уход/.test(text)) return 'Красота';
  if (/наушник|гаджет|электрон|смартфон|колонк/.test(text)) return 'Электроника';
  if (/кухн|мультиварк|готовк|дом/.test(text)) return 'Дом и кухня';
  if (/спорт|фитнес|йога|тренаж/.test(text)) return 'Спорт';
  if (/авто|машин|oem|запчаст/.test(text)) return 'Авто';
  if (/книга|литрес|чтен/.test(text)) return 'Книги';
  return 'Подарки';
}
