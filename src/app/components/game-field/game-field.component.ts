import { Component, OnInit } from '@angular/core';
import { CardTrail } from 'src/app/model/card-trail.interface';
import { CodeCard } from 'src/app/model/code-card.interface';
import { Player } from 'src/app/model/player.interface';
import { GameStateService } from 'src/app/services/game-state.service';
import { ModalController } from '@ionic/angular';
import { AddPlayersModalComponent } from '../modals/add-players-modal/add-players-modal.component';
import { GoalReachedModalComponent } from '../modals/goal-reached-modal/goal-reached-modal.component';
import { EnvironmentCard } from 'src/app/model/environment-card.interface';
import { PlayerRankingModalComponent } from '../modals/player-ranking-modal/player-ranking-modal.component';
import { initializeTracetable } from 'src/app/utils/initiliaze-tracetable';
import { TracetableModalComponent } from '../modals/tracetable-modal/tracetable-modal.component';


@Component({
  selector: 'app-game-field',
  templateUrl: './game-field.component.html',
  styleUrls: ['./game-field.component.scss'],
})
export class GameFieldComponent implements OnInit {
  currentPlayer: Player;
  selectedCard?: CodeCard;
  trailsMarkedForDeletion: CardTrail[] = [];

  constructor(public model: GameStateService, private modalCtrl: ModalController) { 
    this.currentPlayer = model.getNextPlayer();
  }

  ngOnInit() {}

  handleDrop(event: any) {
    console.log(event);
  }

  selectCard(c: CodeCard) {
    this.selectedCard = c;
  }

  async addCard(t: CardTrail) {
    if (!this.selectedCard) {
      return
    }
    t.codeCards.push(this.selectedCard);
    this.currentPlayer.hand = this.currentPlayer.hand.filter(c => c !== this.selectedCard);
    this.currentPlayer.hand.push(this.model.codeCards.pop() as CodeCard);
    this.selectedCard = undefined;
    await this.checkForGoals();
    await this.checkForGameOver();
    this.currentPlayer = this.model.getNextPlayer();
  }

  async checkForGoals() {
    const playersThatReceivedScore: Player[]  = [];
    await Promise.all(this.model.players.map(async  p => {
      await Promise.all(this.model.trails.map(async trail => {
        const trailCode = assertDeclaration + trail.environmentCard.declarationsSnippet + '\n' + trail.codeCards.map(c => c.snippet).join("\n");
        const code = trailCode + '\n' + p.goal?.assertionSnippet;
        try {
          let result = eval(code);
          console.log('checking for: ', code, result);
          if (result) {
            // TODO: add finish trail functionality
            console.log("Player should get points :)");
            p.goal = this.model.goalCards.pop();
            if (!playersThatReceivedScore.includes(p)) {
              p.score += p.goal?.score ?? 0;
              playersThatReceivedScore.push(p);
              const modal = await this.modalCtrl.create({
                component: GoalReachedModalComponent,
                componentProps: { 
                  card: p.goal,
                  player: p
                },
                backdropDismiss:false
              });
              modal.present();
              await modal.onWillDismiss();
              this.trailsMarkedForDeletion.push(trail)
            }
          }
        } catch {
        }
      }))
    }));

    // clear the completed trails
    this.trailsMarkedForDeletion.forEach(t => {
      t.codeCards = [];
      t.environmentCard = this.model.environmentCards.pop() as EnvironmentCard;
      initializeTracetable(t);
    });
    this.trailsMarkedForDeletion = [];
  }

  async checkForGameOver() {
    this.model.players.forEach(p => {
      if (p.score >= this.model.targetScore) {
        // TODO: add win screen
      }
    });
  }
  
  async showTraceTable(t: CardTrail) {
    // TracetableModalComponent
    const modal = await this.modalCtrl.create({
      component: TracetableModalComponent,
      componentProps: {
        trail: t
      },
      backdropDismiss:false
    });
    modal.present();
    await modal.onWillDismiss();
  }

  async showPlayerRanking() {
    const modal = await this.modalCtrl.create({
      component: PlayerRankingModalComponent,
      componentProps: {
        sortedPlayers: this.model.players.sort((a, b) => b.score - a.score),
        targetScore: this.model.targetScore
      },
      backdropDismiss:false
    });
    modal.present();
    await modal.onWillDismiss();
  }
}

const assertDeclaration = `
function assert(condition, message) {
  return condition;
}
`;