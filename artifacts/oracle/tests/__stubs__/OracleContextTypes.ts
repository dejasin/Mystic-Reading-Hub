// Type-only stub so questionnaireData.ts can be loaded in a Node test env
// without pulling in React Native / AsyncStorage from the real OracleContext.
export interface QuestionnaireAnswers {
  decisionStyle: string;
  pressureResponse: string;
  relationshipPattern: string;
  coreMotivation: string;
  biggestChallenge: string;
  energyStyle: string;
  currentNeed: string;
  selfPerception: string;
}
