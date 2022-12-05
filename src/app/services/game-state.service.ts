import { Injectable } from '@angular/core';
import { CardTrail } from '../model/card-trail.interface';
import { CodeCard } from '../model/code-card.interface';
import { EnvironmentCard } from '../model/environment-card.interface';
import { GoalCard } from '../model/goal-card.interface';
import { Player } from '../model/player.interface';
import { CardGeneratorService } from './card-generator.service';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  
  cardTrails: CardTrail[] = [];
  players: Player[] = [];
  currentPlayer: number = 0;

  trailCount = 4;
  trails: CardTrail[] = []

  // decks
  goalCards: GoalCard[] = [];
  codeCards: CodeCard[] = [];
  environmentCards: EnvironmentCard[] = [];


  constructor(private generator: CardGeneratorService) {
  }

  setup() {
    this.currentPlayer = 0;
    this.goalCards = this.generator.getGoalCards();
    this.codeCards = this.generator.getCodeCards();
    this.environmentCards = this.generator.getEnvironmentCards();

    // decks are generated, time to deal the cards
    this.players.forEach( p => {
      p.score = 0

      // every player gets 5 cards from the code deck
      const pHand = [];
      for (let i = 0; i < 5; i++) {
        pHand.push(this.codeCards.pop());
      }
      p.hand = pHand.filter(c => c !== undefined) as CodeCard[];

      // every player gets 1 goal card
      p.goal = this.goalCards.pop();
    });

    // reveal the first x starting environments and setup the trails
    this.trails = [];
    for (let i = 0; i < this.trailCount; i++) {
      this.trails.push({ environmentCard: this.environmentCards.pop() as EnvironmentCard, codeCards: [] });
    }
  }

  getNextPlayer(): Player {
    return this.players[this.currentPlayer++ % this.players.length];
  }

  checkForGoals() {
    throw new Error('Method not implemented.');
  }
}
