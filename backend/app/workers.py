import asyncio
import logging
import os
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.utils.pricing import fetch_card_price

logger = logging.getLogger("holovault.workers")

async def periodic_price_update_sweep():
    """
    Infinite background loop that sweeps the database periodically to update
    missing or stale (older than 24h) card valuations.
    """
    logger.info("Initializing periodic price update sweep background loop...")
    while True:
        try:
            logger.info("Starting background pricing refresh sweep cycle...")
            db: Session = SessionLocal()
            try:
                # Find card slots that have names but no prices, or haven't been updated in 24 hours
                twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
                slots_to_update = db.query(models.CardSlot).filter(
                    models.CardSlot.name != None,
                    models.CardSlot.name != "",
                    (models.CardSlot.last_pricing_update == None) | (models.CardSlot.last_pricing_update < twenty_four_hours_ago)
                ).all()

                logger.info(f"Sweep found {len(slots_to_update)} card slots requiring price refreshes.")
                for slot in slots_to_update:
                    price = await fetch_card_price(slot.name, slot.set_name)
                    slot.market_price = price
                    slot.last_pricing_update = datetime.utcnow()
                    db.commit()
                    logger.info(f"Background sweep updated price for card '{slot.name}' in slot {slot.id} to ${price}")
            except Exception as e:
                logger.error(f"Exception during background price sweep logic: {e}")
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Unhandled exception in background loop: {e}")
            
        # Default sweep check is 1 hour (3600s), configurable via env for testing
        sleep_seconds = int(os.getenv("PRICE_SWEEP_INTERVAL_SECONDS", "3600"))
        logger.info(f"Background pricing sweep sleeping for {sleep_seconds} seconds until next cycle.")
        await asyncio.sleep(sleep_seconds)

def start_background_workers():
    """
    Spawns the sweep worker task inside the active asyncio event loop.
    """
    asyncio.create_task(periodic_price_update_sweep())
