import type { AbacusStageConfig, DigitType, OperationMode, ProblemOperator, TrainingProblem } from '../types/game';

export interface GenerateTrainingProblemsInput {
  stage: AbacusStageConfig;
  problemCount: number;
  numberCount: number;
  digitType: DigitType;
  operationMode: OperationMode;
  seed?: number;
  allowZeroAnswer?: boolean;
  allowNegativeAnswer?: boolean;
  maxAttempts?: number;
}

const DEFAULT_MAX_ATTEMPTS = 100;

function createRandom(seed?: number) {
  if (seed === undefined) return Math.random;

  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function getRandomInt(random: () => number, min: number, max: number) {
  const safeMin = Math.ceil(min);
  const safeMax = Math.floor(max);
  if (safeMax <= safeMin) return safeMin;

  return Math.floor(random() * (safeMax - safeMin + 1)) + safeMin;
}

function getBaseRange(digitType: DigitType) {
  if (digitType === 'one-digit') return { min: 1, max: 9 };
  if (digitType === 'two-digit') return { min: 10, max: 99 };
  if (digitType === 'three-digit') return { min: 100, max: 999 };
  if (digitType === 'mixed-two-three-digit') return { min: 10, max: 999 };
  return { min: 1, max: 99 };
}

function getStageAwareRange(stage: AbacusStageConfig, digitType: DigitType) {
  const base = getBaseRange(digitType);
  const min = Math.max(base.min, stage.minNumber);
  const max = Math.min(base.max, stage.maxNumber);

  if (min <= max) return { min, max };
  return base;
}

function getRandomTerm(random: () => number, stage: AbacusStageConfig, digitType: DigitType) {
  if (digitType === 'mixed-digit') {
    const oneDigitRange = getStageAwareRange(stage, 'one-digit');
    const twoDigitRange = getStageAwareRange(stage, 'two-digit');
    const canUseOneDigit = oneDigitRange.min <= oneDigitRange.max && oneDigitRange.max <= 9;
    const canUseTwoDigit = twoDigitRange.min <= twoDigitRange.max && twoDigitRange.min >= 10;

    if (canUseOneDigit && canUseTwoDigit) {
      return random() < 0.5 ? getRandomInt(random, oneDigitRange.min, oneDigitRange.max) : getRandomInt(random, twoDigitRange.min, twoDigitRange.max);
    }
  }

  if (digitType === 'mixed-two-three-digit') {
    const twoDigitRange = getStageAwareRange(stage, 'two-digit');
    const threeDigitRange = getStageAwareRange(stage, 'three-digit');
    return random() < 0.5
      ? getRandomInt(random, twoDigitRange.min, twoDigitRange.max)
      : getRandomInt(random, threeDigitRange.min, threeDigitRange.max);
  }

  const range = getStageAwareRange(stage, digitType);
  return getRandomInt(random, range.min, range.max);
}

function calculateAnswer(numbers: number[], operators: ProblemOperator[]) {
  return operators.reduce((total, operator, index) => {
    const nextNumber = numbers[index + 1] ?? 0;
    return operator === '+' ? total + nextNumber : total - nextNumber;
  }, numbers[0] ?? 0);
}

function formatExpression(numbers: number[], operators: ProblemOperator[]) {
  return numbers
    .map((number, index) => (index === 0 ? String(number) : `${operators[index - 1]} ${number}`))
    .join(' ');
}

function buildSubtractOnlyTerms(random: () => number, stage: AbacusStageConfig, numberCount: number, digitType: DigitType) {
  const range = getStageAwareRange(stage, digitType);
  const minimumFirstNumber = Math.min(range.max, Math.max(range.min, range.min * (numberCount - 1)));
  const numbers = [getRandomInt(random, minimumFirstNumber, range.max)];
  const operators: ProblemOperator[] = [];
  let currentTotal = numbers[0];

  for (let index = 1; index < numberCount; index += 1) {
    const remainingSubtractions = numberCount - index - 1;
    const maxSubtract = Math.max(range.min, Math.min(range.max, currentTotal - remainingSubtractions * range.min));
    const nextNumber = getRandomInt(random, range.min, maxSubtract);
    numbers.push(nextNumber);
    operators.push('-');
    currentTotal -= nextNumber;
  }

  return { numbers, operators };
}

function buildTerms(random: () => number, stage: AbacusStageConfig, numberCount: number, digitType: DigitType, operationMode: OperationMode) {
  if (operationMode === 'subtract') {
    return buildSubtractOnlyTerms(random, stage, numberCount, digitType);
  }

  const range = getStageAwareRange(stage, digitType);
  const numbers = [getRandomTerm(random, stage, digitType)];
  const operators: ProblemOperator[] = [];
  let currentTotal = numbers[0];
  let usedSubtract = false;

  for (let index = 1; index < numberCount; index += 1) {
    const remainingSlots = numberCount - index;
    const shouldPreferSubtract = operationMode === 'mixed' && !usedSubtract && remainingSlots === 1;
    const shouldSubtract = operationMode === 'mixed' && (shouldPreferSubtract || random() < 0.45);

    if (shouldSubtract && !stage.allowNegative && currentTotal >= range.min) {
      const maxSubtract = Math.min(range.max, currentTotal);
      const nextNumber = getRandomInt(random, range.min, maxSubtract);
      numbers.push(nextNumber);
      operators.push('-');
      currentTotal -= nextNumber;
      usedSubtract = true;
      continue;
    }

    const nextNumber = getRandomTerm(random, stage, digitType);
    numbers.push(nextNumber);
    operators.push('+');
    currentTotal += nextNumber;
  }

  return { numbers, operators };
}

function isAllowedAnswer(answer: number, allowZeroAnswer: boolean, allowNegativeAnswer: boolean) {
  if (!allowNegativeAnswer && answer < 0) return false;
  if (!allowZeroAnswer && answer === 0) return false;
  return true;
}

function hasRequiredDigitMix(numbers: number[], digitType: DigitType) {
  if (digitType !== 'mixed-two-three-digit' || numbers.length < 2) return true;

  return numbers.some((number) => number >= 10 && number <= 99) && numbers.some((number) => number >= 100 && number <= 999);
}

function buildPositiveFallbackTerms(stage: AbacusStageConfig, numberCount: number, digitType: DigitType, operationMode: OperationMode) {
  const safeNumberCount = Math.max(1, numberCount);
  const { min, max } = getStageAwareRange(stage, digitType);

  if (digitType === 'mixed-two-three-digit' && safeNumberCount >= 2) {
    const tailNumbers = Array.from({ length: safeNumberCount - 1 }, (_, index) => (index % 2 === 0 ? 10 : 100));

    if (operationMode === 'subtract') {
      const subtractionTotal = tailNumbers.reduce((total, number) => total + number, 0);
      return {
        numbers: [subtractionTotal + 1, ...tailNumbers],
        operators: Array.from({ length: safeNumberCount - 1 }, () => '-' as const),
      };
    }

    const numbers = [10, 100, ...tailNumbers.slice(1)];
    const operators: ProblemOperator[] = Array.from({ length: safeNumberCount - 1 }, () => '+');
    if (operationMode === 'mixed' && operators.length >= 2) operators[1] = '-';
    return { numbers, operators };
  }

  if (operationMode === 'subtract') {
    const minimumPositiveFirstNumber = min * (safeNumberCount - 1) + 1;
    const firstNumber = Math.min(max, Math.max(min, minimumPositiveFirstNumber));
    const numbers = [firstNumber, ...Array.from({ length: safeNumberCount - 1 }, () => min)];
    const operators = Array.from({ length: safeNumberCount - 1 }, () => '-' as const);

    // Supported training ranges (1~9, 10~99, 100~999) and 3~8 rows
    // always have enough room for this subtraction fallback to remain positive.
    return { numbers, operators };
  }

  const numbers = Array.from({ length: safeNumberCount }, () => min);
  const operators: ProblemOperator[] = Array.from({ length: safeNumberCount - 1 }, () => '+');

  if (operationMode === 'mixed' && operators.length >= 2) {
    operators[1] = '-';
  }

  return { numbers, operators };
}

function buildValidTerms(
  random: () => number,
  stage: AbacusStageConfig,
  numberCount: number,
  digitType: DigitType,
  operationMode: OperationMode,
  allowZeroAnswer: boolean,
  allowNegativeAnswer: boolean,
  maxAttempts: number,
) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = buildTerms(random, stage, numberCount, digitType, operationMode);
    const answer = calculateAnswer(candidate.numbers, candidate.operators);

    if (isAllowedAnswer(answer, allowZeroAnswer, allowNegativeAnswer) && hasRequiredDigitMix(candidate.numbers, digitType)) {
      return { ...candidate, answer };
    }
  }

  const fallback = buildPositiveFallbackTerms(stage, numberCount, digitType, operationMode);
  return {
    ...fallback,
    answer: calculateAnswer(fallback.numbers, fallback.operators),
  };
}

export function generateTrainingProblems({
  stage,
  problemCount,
  numberCount,
  digitType,
  operationMode,
  seed,
  allowZeroAnswer = false,
  allowNegativeAnswer = false,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
}: GenerateTrainingProblemsInput): TrainingProblem[] {
  const random = createRandom(seed);
  const safeMaxAttempts = Math.max(0, Math.floor(maxAttempts));

  return Array.from({ length: problemCount }, (_, index) => {
    const { numbers, operators, answer } = buildValidTerms(
      random,
      stage,
      numberCount,
      digitType,
      operationMode,
      allowZeroAnswer,
      allowNegativeAnswer,
      safeMaxAttempts,
    );
    const expressionText = formatExpression(numbers, operators);

    return {
      id: `generated-${stage.id}-${Date.now()}-${index + 1}`,
      index,
      numbers,
      operators,
      correctAnswer: answer,
      displayText: expressionText,
      status: 'ready',
      expressionText,
      answer,
      level: stage.level,
      stageId: stage.id,
    };
  });
}
