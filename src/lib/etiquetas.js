// Etiquetas automáticas de una empanada según sus ingredientes.
export function calcularEtiquetas({ proteina, queso, acompanamientos = [] }) {
  const tags = new Set();
  [proteina, queso, ...acompanamientos].forEach((ing) => {
    (ing?.tags || []).forEach((t) => tags.add(t));
  });

  const esVegana =
    proteina?.tags?.includes('vegana') &&
    queso?.tags?.includes('vegano') &&
    acompanamientos.every((a) => a?.tags?.includes('vegetal'));

  // Vegetariana SOLO si la proteína es de origen vegetal (acelga, espinaca, seitan, zapallo…)
  // — antes pasaba carne/pollo como vegetariana si los acompañamientos eran todos verduras.
  const proteinaVegetal = proteina?.tags?.some((t) => t === 'vegana' || t === 'vegetal');
  const esVegetariana =
    !esVegana &&
    proteinaVegetal &&
    acompanamientos.every((a) => a?.tags?.includes('vegetal'));

  const etiquetas = [];
  if (esVegana) etiquetas.push({ id: 'vegana', label: 'Vegana', emoji: '🌱', color: '#4E9A51' });
  else if (esVegetariana) etiquetas.push({ id: 'vegetariana', label: 'Vegetariana', emoji: '🥬', color: '#6FBF73' });
  if (tags.has('pescado')) etiquetas.push({ id: 'pescado', label: 'Con pescado', emoji: '🐟', color: '#5B8CB8' });
  if (tags.has('marisco')) etiquetas.push({ id: 'marisco', label: 'Con marisco', emoji: '🦐', color: '#E86A4F' });
  if (tags.has('picante')) etiquetas.push({ id: 'picante', label: 'Picante', emoji: '🌶️', color: '#DC4B3E' });

  return { etiquetas, esVegana, esVegetariana, tags: [...tags] };
}

export function filtrarPorDieta(ingredientes, dieta) {
  if (dieta === 'vegana') {
    return ingredientes.filter((i) =>
      i.tags?.includes('vegano') || i.tags?.includes('vegana') || i.tags?.includes('vegetal')
    );
  }
  if (dieta === 'vegetariana') {
    return ingredientes.filter((i) => !i.tags?.some((t) => t === 'pescado' || t === 'marisco'));
  }
  return ingredientes;
}
