import { serveDir } from "@std/http/file-server";

const MAX_PLAYERS = 4;
const BLACKJACK = 21;
const STARTING_MONEY = 20;
const MINIUMUM_BET = 1;

let number_of_rounds = 0;

type Suit =
  | "clubs" // (♣)
  | "diamonds" // (♦)
  | "hearts" // (♥)
  | "spades"; // (♠)

type Ess = { high: number; low: number };

class Card {
  constructor(
    public rank: number, // ace is 1 king is 13
    public suit: Suit,
  ) {}
  public value(): number | Ess {
    if (this.rank === 1) { // ace
      return {
        high: 11,
        low: 1,
      };
    }
    // the clothed cards is worth 10
    if (this.rank > 9) {
      return 10;
    }
    return this.rank;
  }

  public image(): string {
    const suit = this.suit.charAt(0).toUpperCase();

    return `cards/${this.rank}-${suit}.png`;
  }
}
// TODO pop the last card to deal
//
const Dealer = () => {
};
// WARN should be validated to happen at the correct place and time
type ClientAction =
  | "doubleDown"
  | "split"
  // | "insurance"
  | "evenMoney"
  | "hit" // ?
  | "stay" // ?
  | "put" // ?
;

// TODO improve name
type HitStand =
  | null
  | "stand" // ✋
  | "hit"; // 👉

// I do not like having enum as string
type Phase =
  | "deal"
  | "betting"
  | "stand_or_hit"
  | "special_action";

let current_phase: Phase = "deal";

// function handValue(cards: Card[]): number {
//   let normal: number[] = [];
//   let ess: Ess[]  =  [];
//   for (const card of cards) {
//     const value = card.value;
//     switch (typeof value) {
//       case "number":
//         normal.push(value)
//         break;
//       case "object": // ess
//         ess.push(value)
//         break;
//     }
//   }
//   let sum = normal.;

//   if (sum >= BLACKJACK) {
//     if
//     sum -=

//   }

//   return sum;
// }

function actOnPhase(phase: Phase) {
  switch (phase) {
    case "deal":
      for (const player of players) {
        const card_draw = deck.pop();
        console.assert(card_draw !== undefined); // probably impossible to have no cards left
        if (
          card_draw && (player.hitstand === "hit" || player.hitstand === null)
        ) {
          player.cards.push(card_draw);
        }
      }
      phase = "betting";
      break;
    case "betting": {
      const allPlayersBet = players.every((player) => player.bet !== 0);
      if (allPlayersBet) {
        phase = "deal";
      }

      break;
    }
    case "stand_or_hit": {
      const allPlayersHitStand = players.every((player) =>
        player.hitstand !== null
      );
      if (allPlayersHitStand) {
        phase = "deal";
      }
      break;
    }
    case "special_action":
      console.warn("actions not implemented!");
      break;
  }
}

type Player = {
  socket: WebSocket;
  cards: Card[];
  money: number; // dollars
  hitstand: HitStand;
  bet: number;
  // powerups: number;
  // perma_powerups: number;
};

// # Powerups categories
// ## Activated when you buy them
//
//
//
//
//
//
// ## Activated after conditions of time after you bough them
//  price 10 dollars, get 15 next shop time
//
//
//
// ## Perma active after you buy
//
// 19 is also 21
//
//
//
// # Phases
// - players bets
// - dealer deals cards,
// - special actions
// - stand or  "mer kort" (other name)
// - dealer deals cards
// (repeat ) until done

function shufflededDeck(): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < 13; i++) {
    deck.push(new Card(i, "clubs"));
    deck.push(new Card(i, "diamonds"));
    deck.push(new Card(i, "hearts"));
    deck.push(new Card(i, "spades"));
  }
  shuffle(deck);

  return deck;
}

//Fisher-Yates shuffle
function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Generate a random index between 0 and i
    [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
  }
}

const deck = shufflededDeck();
console.assert(deck.length == 52);

let players: Player[] = [];

console.log(deck);

Deno.serve(async (req) => {
  if (req.headers.get("upgrade") != "websocket") {
    // serve static files
    const url = new URL(req.url);
    const pathname = url.pathname;

    if (pathname === "/") {
      const file = await Deno.open("./src/static/index.html", { read: true });
      return new Response(file.readable);
    }

    if (pathname.startsWith("/static")) {
      return serveDir(req, {
        fsRoot: "src/static",
        urlRoot: "static",
      });
    }
    if (pathname.startsWith("/assets")) {
      return serveDir(req, {
        fsRoot: "assets",
        urlRoot: "assets",
      });
    }
    return new Response();
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log("client connected");
    if (players.length > MAX_PLAYERS) {
      socket.send("max players reached");
      console.log(
        `A ${MAX_PLAYERS + 1}:th player joined but its over the maximum`,
      );
    } else {
      players.push({
        socket,
        cards: [],
        money: STARTING_MONEY,
        hitstand: null,
        bet: 0,
      });
    }
  };

  socket.onclose = () => {
    console.warn(socket, "closed connection!");
    // remove player from players
    players = players.filter((p) => { //idk if this safe,  egil (the client) actually wants us to be able to reconnect
      socket !== p.socket;
    });
    // maybe could use splice and indexOf
  };
  socket.onmessage = (msg) => {
    console.log(msg);
  };
  socket.onerror = (e) => {
    console.error(e);
  };

  return response;
});
