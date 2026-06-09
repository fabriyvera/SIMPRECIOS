"""
Geolocation Service

This service provides utility functions for geolocation calculations,
such as calculating the distance between two geographical points.
"""

import math


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the distance between two points (latitude and longitude)
    using the Haversine formula. Returns the distance in kilometers.
    """
    R = 6371  # Earth radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    r_lat1 = math.radians(lat1)
    r_lat2 = math.radians(lat2)

    a = math.sin(d_lat / 2) * math.sin(d_lat / 2) + math.cos(r_lat1) * math.cos(r_lat2) * math.sin(d_lon / 2) * math.sin(d_lon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance