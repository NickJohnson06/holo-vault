import asyncio
import logging
import hashlib
from typing import Optional

logger = logging.getLogger("holovault.pricing")

# A catalog of popular Pokémon and their base values
BASE_POKEMON_PRICES = {
    "charizard": 120.0,
    "lugia": 85.0,
    "rayquaza": 75.0,
    "gengar": 45.0,
    "mewtwo": 40.0,
    "blastoise": 38.0,
    "venusaur": 35.0,
    "pikachu": 12.0,
    "eevee": 8.0,
    "mew": 25.0,
    "lucario": 15.0,
    "snorlax": 18.0,
    "umbreon": 55.0,
    "espeon": 30.0,
    "gyarados": 22.0,
    "arceus": 32.0,
}

# Valuation multipliers based on historical sets
SET_MULTIPLIERS = {
    "base set": 2.5,
    "1st edition": 4.0,
    "shadowless": 3.5,
    "neo genesis": 2.0,
    "team rocket": 1.8,
    "jungle": 1.4,
    "fossil": 1.4,
    "skyridge": 3.0,
    "aquapolis": 2.8,
    "shining fates": 1.2,
    "hidden fates": 1.3,
    "evolutions": 1.1,
}

async def fetch_card_price(card_name: str, set_name: Optional[str] = None) -> float:
    """
    Simulates fetching a card's current market value from TCGPlayer/eBay.
    Uses artificial latency (asyncio.sleep) to represent external network queries.
    Determines authentic market valuations using card name tiers and set multipliers,
    with a deterministic fallback for uncatalogued cards.
    """
    logger.info(f"Initiating pricing sweep query for card: '{card_name}' [Set: '{set_name or 'N/A'}']")
    
    # 1. Represent API request roundtrip latency
    await asyncio.sleep(1.2)

    # Normalize inputs for search matching
    card_norm = card_name.lower().strip()
    set_norm = set_name.lower().strip() if set_name else ""

    # 2. Determine base value
    base_price = 0.0
    matched = False
    
    # Check catalog matches
    for key, value in BASE_POKEMON_PRICES.items():
        if key in card_norm:
            base_price = value
            matched = True
            break

    if not matched:
        # Generate a deterministic but consistent price between $0.99 and $7.50 for unknown cards
        hasher = hashlib.md5(card_norm.encode('utf-8'))
        hash_val = int(hasher.hexdigest()[:6], 16)
        base_price = 0.99 + (hash_val % 651) / 100.0

    # 3. Apply set multipliers
    multiplier = 1.0
    for key, val in SET_MULTIPLIERS.items():
        if key in set_norm or key in card_norm:
            multiplier *= val

    # 4. Check for special card variants that boost price
    if "holo" in card_norm or "holographic" in card_norm:
        multiplier *= 1.5
    if "gold star" in card_norm or "shiny" in card_norm:
        multiplier *= 3.0
    if "promo" in card_norm:
        multiplier *= 1.2

    # Compute final valuation rounded to two decimal places
    final_price = round(base_price * multiplier, 2)
    logger.info(f"Completed query. Valuation resolved: ${final_price} for '{card_name}'")
    return final_price
