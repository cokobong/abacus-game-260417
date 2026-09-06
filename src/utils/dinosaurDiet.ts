import type { FoodItemConfig } from '../config/itemConfig';
import type { DinosaurDiet, DinosaurSpecies } from '../data/dinosaurSpecies';

export function canDinosaurEat(
  dinosaur: Pick<DinosaurSpecies, 'diet'> | null | undefined,
  food: Pick<FoodItemConfig, 'dietType'> | null | undefined,
) {
  if (!dinosaur || !food) return false;
  if (food.dietType === 'universal') return true;
  if (dinosaur.diet === 'omnivore') return food.dietType === 'herbivore' || food.dietType === 'carnivore';
  return dinosaur.diet === food.dietType;
}

export function getDinosaurDietLabel(diet: DinosaurDiet) {
  if (diet === 'herbivore') return '초식';
  if (diet === 'carnivore') return '육식';
  return '잡식';
}

export function getFoodDietLabel(dietType: FoodItemConfig['dietType']) {
  if (dietType === 'herbivore') return '초식 공룡용';
  if (dietType === 'carnivore') return '육식 공룡용';
  if (dietType === 'omnivore') return '잡식 공룡용';
  return '모든 공룡 공용';
}

export function getIncompatibleFoodMessage(dinosaur: Pick<DinosaurSpecies, 'displayName' | 'diet'>, foodName: string) {
  return `${dinosaur.displayName}은 ${getDinosaurDietLabel(dinosaur.diet)} 공룡이라 ${foodName}을(를) 먹을 수 없어요.`;
}
