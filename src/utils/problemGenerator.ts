export type ChapterType = 9 | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1;

export interface Problem {
  chapter: ChapterType;
  terms: number[];
  answer: number;
  description: string;
}

export function generateChapterProblem(chapter: ChapterType, termCount: number): Problem {
  const terms: number[] = [];
  
  // 1행: 타겟 숫자를 더했을 때 10이 넘어가도록 기초값 설정 (10-target ~ 9)
  const minFirst = 10 - chapter;
  const firstTerm = Math.floor(Math.random() * (9 - minFirst + 1)) + minFirst;
  terms.push(firstTerm);
  let currentSum = firstTerm;

  // 2행: 단원의 핵심인 타겟 숫자 배치
  if (termCount >= 2) {
    terms.push(chapter);
    currentSum += chapter;
  }

  // 3행 이상: 추가적인 연산 (1~9 사이의 난수, 가끔 뺄셈)
  for (let i = 2; i < termCount; i++) {
    let num = Math.floor(Math.random() * 9) + 1;
    // 뺄셈 로직 (결과가 0 이상이 되도록)
    if (Math.random() > 0.3 && currentSum - num >= 0) {
      num = -num;
    }
    terms.push(num);
    currentSum += num;
  }

  return {
    chapter,
    terms,
    answer: currentSum,
    description: `${chapter}을(를) 더할 때 보수 ${10 - chapter}을(를) 빼고 10을 올립니다.`
  };
}
