import os
import asyncio
from datetime import date, timedelta
from typing import Any, Optional

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TripGeo Backend", version="0.1.0")

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://yg674-dev.github.io,http://localhost:3000,http://127.0.0.1:5500",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS],
    allow_methods=["GET"],
    allow_headers=["*"],
)

TP_TOKEN = os.getenv("TRAVELPAYOUTS_TOKEN")
TP_MARKER = os.getenv("TRAVELPAYOUTS_MARKER")
RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = os.getenv("RAPIDAPI_HOST", "booking-com15.p.rapidapi.com")

# dest_id values are wrapper-specific. After subscribing on RapidAPI, hit
# /api/lookup?query=Bali to fetch the right id for your wrapper and paste here.
ROUTES = [
    {"key": "bali",      "city": "Bali, Indonesia",   "emoji": "🏝️",
     "origin": "LAX", "destination": "DPS", "nights": 7, "dest_id": ""},
    {"key": "santorini", "city": "Santorini, Greece", "emoji": "🏛️",
     "origin": "LAX", "destination": "JTR", "nights": 5, "dest_id": ""},
    {"key": "tokyo",     "city": "Tokyo, Japan",      "emoji": "🗼",
     "origin": "LAX", "destination": "HND", "nights": 6, "dest_id": ""},
]


def aviasales_link(origin: str, destination: str, dep: date, ret: date,
                   passengers: int = 2, marker: Optional[str] = None) -> str:
    dep_s = dep.strftime("%d%m")
    ret_s = ret.strftime("%d%m")
    url = f"https://www.aviasales.com/search/{origin}{dep_s}{destination}{ret_s}{passengers}"
    if marker:
        url += f"?marker={marker}"
    return url


@app.get("/api/health")
async def health() -> dict[str, Any]:
    return {
        "ok": True,
        "travelpayouts_configured": bool(TP_TOKEN),
        "travelpayouts_marker": bool(TP_MARKER),
        "rapidapi_configured": bool(RAPIDAPI_KEY),
        "rapidapi_host": RAPIDAPI_HOST,
        "allowed_origins": ALLOWED_ORIGINS,
    }


async def fetch_flight(client: httpx.AsyncClient, route: dict) -> Optional[dict]:
    if not TP_TOKEN:
        return None
    params = {
        "origin": route["origin"],
        "destination": route["destination"],
        "currency": "usd",
        "period_type": "year",
        "page": 1,
        "limit": 10,
        "show_to_affiliates": "true",
        "sorting": "price",
        "token": TP_TOKEN,
    }
    try:
        r = await client.get(
            "https://api.travelpayouts.com/v2/prices/latest",
            params=params, timeout=10,
        )
        r.raise_for_status()
        rows = r.json().get("data", []) or []
        if not rows:
            return None
        prices = sorted(int(row["value"]) for row in rows)
        cheapest = min(rows, key=lambda x: x["value"])
        dep = date.fromisoformat(cheapest["depart_date"])
        ret = date.fromisoformat(cheapest["return_date"])
        return {
            "lowest": prices[0],
            "median": prices[len(prices) // 2],
            "highest": prices[-1],
            "currency": "USD",
            "airline": cheapest.get("airline"),
            "departureDate": cheapest["depart_date"],
            "returnDate": cheapest["return_date"],
            "affiliateLink": aviasales_link(
                route["origin"], route["destination"], dep, ret, marker=TP_MARKER,
            ),
            "sample": len(prices),
        }
    except httpx.HTTPError as e:
        return {"error": f"travelpayouts: {e}"}


async def fetch_hotel(client: httpx.AsyncClient, route: dict) -> Optional[dict]:
    if not RAPIDAPI_KEY or not route.get("dest_id"):
        return None
    arrival = date.today() + timedelta(days=45)
    departure = arrival + timedelta(days=route["nights"])
    params = {
        "dest_id": route["dest_id"],
        "search_type": "CITY",
        "arrival_date": arrival.isoformat(),
        "departure_date": departure.isoformat(),
        "adults": 2,
        "currency_code": "USD",
        "languagecode": "en-us",
        "sort_by": "price",
        "page_number": 1,
    }
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
    }
    try:
        r = await client.get(
            f"https://{RAPIDAPI_HOST}/api/v1/hotels/searchHotels",
            params=params, headers=headers, timeout=15,
        )
        r.raise_for_status()
        body = r.json()
        hotels = (body.get("data") or {}).get("hotels") or body.get("result") or []
        if not hotels:
            return None
        first = hotels[0]
        prop = first.get("property") or first
        total = (
            (prop.get("priceBreakdown") or {}).get("grossPrice", {}).get("value")
            or prop.get("min_total_price")
            or prop.get("price")
        )
        if total is None:
            return None
        total = float(total)
        return {
            "name": prop.get("name") or first.get("hotel_name"),
            "totalPrice": round(total),
            "pricePerNight": round(total / route["nights"]),
            "rating": prop.get("reviewScore") or prop.get("review_score"),
            "checkIn": arrival.isoformat(),
            "checkOut": departure.isoformat(),
            "currency": "USD",
        }
    except httpx.HTTPError as e:
        return {"error": f"rapidapi: {e}"}


@app.get("/api/deals")
async def deals() -> dict[str, Any]:
    async with httpx.AsyncClient() as client:
        tasks = [
            asyncio.gather(fetch_flight(client, r), fetch_hotel(client, r))
            for r in ROUTES
        ]
        pairs = await asyncio.gather(*tasks)

    out = []
    for route, (flight, hotel) in zip(ROUTES, pairs):
        bundle = None
        if (flight and isinstance(flight, dict) and "lowest" in flight
                and hotel and isinstance(hotel, dict) and hotel.get("totalPrice")):
            bundle = int(flight["lowest"]) + int(hotel["totalPrice"])
        out.append({
            "key": route["key"],
            "city": route["city"],
            "emoji": route["emoji"],
            "origin": route["origin"],
            "destination": route["destination"],
            "nights": route["nights"],
            "flight": flight,
            "hotel": hotel,
            "bundlePrice": bundle,
        })

    return {
        "updatedAt": date.today().isoformat(),
        "source": "travelpayouts+booking",
        "deals": out,
    }


@app.get("/api/lookup")
async def lookup(query: str = Query(..., min_length=2)) -> dict[str, Any]:
    if not RAPIDAPI_KEY:
        raise HTTPException(503, "RAPIDAPI_KEY not set")
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": RAPIDAPI_HOST,
    }
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://{RAPIDAPI_HOST}/api/v1/hotels/searchDestination",
            params={"query": query, "languagecode": "en-us"},
            headers=headers, timeout=10,
        )
        r.raise_for_status()
        return r.json()


@app.get("/api/flight-link")
async def flight_link(
    origin: str, destination: str,
    depart: str, ret: str, passengers: int = 2,
) -> dict[str, str]:
    dep = date.fromisoformat(depart)
    rtn = date.fromisoformat(ret)
    return {
        "url": aviasales_link(origin, destination, dep, rtn, passengers, TP_MARKER),
    }
