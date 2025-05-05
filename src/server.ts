import { serveDir } from "@std/http/file-server";

const MAX_PLAYERS = 4;
const BLACKJACK = 21;
const STARTING_MONEY = 20;
const MINIUMUM_BET = 1;

let number_of_rounds = 0;

let started: boolean = false;

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
  public getValue(): number | Ess {
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
// function compare_with_dealer(dealer, playerHand: HandValue): {};

// const Dealer = () => ({
//   hand: [],
// });

// WARN should be validated to happen at the correct place and time
type ClientAction =
  // | "insurance"
  | { type: "restartGame" } // temporary
  | { type: "doubleDown" }
  | { type: "split" }
  | { type: "evenMoney" }
  | { type: "hit" }
  | { type: "stand" }
  | { type: "put" }
  | { type: "bet"; amount: number };

// TODO create this, preferably so js also can understand using something like
type ServerEvent = {};

// TODO improve name
type HitStand =
  | null
  | "stand" // ✋
  | "hit"; // 👉

// I do not like having enum as string
type Phase =
  | "deal"
  | "stand_or_hit"
  | "special_action"
  | "stand_or_hit"
  | "compare";

let phase: Phase = "deal";

type HandValue = number | "bust";
function handValue(cards: Card[]): HandValue {
  const normalCards: number[] = [];
  const esses: Ess[] = [];
  for (const card of cards) {
    const value = card.getValue();
    switch (typeof value) {
      case "number":
        normalCards.push(value);
        break;
      case "object": // ess
        esses.push(value);
        break;
    }
  }
  const normalSum = normalCards.reduce((a, b) => a + b, 0);

  let sum = normalSum;

  for (const ess of esses) {
    sum += ess.high; // 11
  }
  // should probably use a while loop instrad
  if (sum > BLACKJACK) {
    for (const ess of esses) {
      const diff = ess.high - ess.low; //10 stupid I know...

      sum -= diff;
      if (sum <= BLACKJACK) {
        break;
      }
    }
    if (sum > BLACKJACK) {
      return "bust";
    }
  }
  return sum;
}

function actOnPhase() {
  switch (phase) {
    case "deal":
      // we will also need to deal at the start of the game

      for (const player of players) {
        const card_draw = deck.pop();
        console.assert(card_draw !== undefined); // probably impossible to have no cards left
        if (
          card_draw && (player.hitstand === "hit" || player.hitstand === null)
        ) {
          player.cards.push(card_draw);
        }
      }
      break;

    case "compare": { // IDK if this should be a phase
      unimplemented();

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

  const player: Player = {
    socket,
    cards: [],
    money: STARTING_MONEY,
    hitstand: null,
    bet: 0,
  };
  socket.onopen = () => {
    console.log("client connected");

    if (players.length > MAX_PLAYERS) {
      // socket.send("max players reached"); // we need to create server side message type
      // TODO inform the player
      console.log(
        `A ${MAX_PLAYERS + 1}:th player joined but its over the maximum`,
      );
      return;
    }
    if (started) {
      // TODO inform the player
      console.log("a player tried to join but the game is already running!");
      return;
    }
    players.push(player);
  };

  socket.onclose = () => {
    console.warn(socket, "closed connection!");
    // remove player from players
    players = players.filter((p) => {
      socket !== p.socket;
    });
  };
  socket.onmessage = (msg) => {
    console.log(msg);

    const action = JSON.parse(msg.data) as ClientAction;

    switch (action.type) {
      case "restartGame":
        // should probably only be the first player that can do this
        unimplemented();
        break;
      case "doubleDown":
        unimplemented();
        break;
      case "split":
        unimplemented();
        break;
      case "evenMoney":
        unimplemented();
        break;
      case "bet": {
        const amount = action.amount;
        if (amount < MINIUMUM_BET) {
          console.warn("A player tried to bet less than ", MINIUMUM_BET);
          break;
        }
        player.bet = action.amount;
        const allPlayersBet = players.every((player) => player.bet !== 0);
        if (allPlayersBet) {
          phase = "deal";
          actOnPhase();
          phase = "stand_or_hit";
        }
        break;
      }
      case "hit":
        if (phase === "stand_or_hit") {
          player.hitstand = "hit";
        }
        break;
      case "stand":
        if (phase === "stand_or_hit") {
          player.hitstand = "stand";
        }
        break;
      case "put":
        unimplemented();
        break;
      default:
        console.warn("Client sent an invalid action");
    }

    // everthing is initiated by the players, probably not the best way to do it...
    actOnPhase();
  };
  socket.onerror = (e) => {
    console.error(e);
  };

  return response;
});

function unimplemented() {
  throw new Error("Not implemented");
}
