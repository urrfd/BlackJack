const MAX_PLAYERS = 6;
const BLACKJACK = 21;

type Suit =
  | "clubs" // (♣)
  | "diamonds" // (♦)
  | "hearts" // (♥)
  | "spades"; // (♠)

class Card {
  constructor(
    public rank: number, // ace is 1 king is 13
    public suit: Suit,
  ) {}
  public value(): number | { high: number; low: number } {
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
}
// TODO pop the last card to deal
//
const Dealer = () => {
};
// WARN should be validated to happen at the correct place and time
type ClientAction =
  | "doubleDown"
  | "split"
  | "insurance"
  | "evenMoney";

type Player = {
  socket: WebSocket;
  // cards: Card[],
  // chips
};

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
const players: Player[] = [];

Deno.serve((req) => {
  if (req.headers.get("upgrade") != "websocket") {
    return new Response(null, { status: 501 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);

  socket.onopen = () => {
    console.log("client connected");
    if (players.length > MAX_PLAYERS) {
      socket.send("max players reached");
      console.log(
        `A ${MAX_PLAYERS + 1}:th player joined but its ower the maximum`,
      );
    } else {
      players.push({ socket });
    }
  };

  socket.onclose = () => {
    // remove client from player  if player
  };
  socket.onmessage = (msg) => {
    console.log(msg);
  };
  socket.onerror = (e) => {
    console.error(e);
  };

  return response;
});
