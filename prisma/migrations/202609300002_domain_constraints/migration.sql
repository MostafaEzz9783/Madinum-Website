CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Occupancy"
  ADD CONSTRAINT occupancy_dates CHECK ("endDate" > "startDate"),
  ADD CONSTRAINT occupancy_booking_kind CHECK (
    (status IN ('HELD', 'BOOKED') AND "bookingId" IS NOT NULL)
    OR (status IN ('BLOCKED', 'MAINTENANCE') AND "bookingId" IS NULL)
  ),
  ADD CONSTRAINT occupancy_no_overlap EXCLUDE USING gist (
    "unitId" WITH =,
    daterange("startDate", "endDate", '[)') WITH &&
  );

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_dates CHECK ("checkOut" > "checkIn"),
  ADD CONSTRAINT booking_amount CHECK ("totalMinor" >= 0),
  ADD CONSTRAINT booking_guests CHECK (guests > 0);

ALTER TABLE "BookingQuote"
  ADD CONSTRAINT quote_dates CHECK ("checkOut" > "checkIn"),
  ADD CONSTRAINT quote_amount CHECK ("totalMinor" >= 0),
  ADD CONSTRAINT quote_guests CHECK (guests > 0);

ALTER TABLE "HospitalityUnit"
  ADD CONSTRAINT unit_rate CHECK ("baseRateMinor" >= 0),
  ADD CONSTRAINT unit_capacity CHECK ("maxGuests" > 0 AND "includedGuests" > 0 AND "includedGuests" <= "maxGuests"),
  ADD CONSTRAINT unit_minimum_stay CHECK ("minimumNights" > 0),
  ADD CONSTRAINT unit_beds CHECK (beds > 0);

ALTER TABLE "DailyRate"
  ADD CONSTRAINT daily_rate_amount CHECK ("rateMinor" >= 0),
  ADD CONSTRAINT daily_rate_minimum CHECK ("minimumNights" > 0);

ALTER TABLE "PricingRule"
  ADD CONSTRAINT rule_dates CHECK ("endDate" IS NULL OR "startDate" IS NULL OR "endDate" > "startDate"),
  ADD CONSTRAINT rule_amount CHECK ("amountMinor" IS NULL OR "amountMinor" >= 0),
  ADD CONSTRAINT rule_percentage CHECK ("basisPoints" IS NULL OR "basisPoints" BETWEEN 0 AND 10000),
  ADD CONSTRAINT rule_minimum CHECK ("minimumNights" IS NULL OR "minimumNights" > 0),
  ADD CONSTRAINT rule_weekdays CHECK (weekdays <@ ARRAY[0,1,2,3,4,5,6]);

ALTER TABLE "Property"
  ADD CONSTRAINT property_dimensions CHECK (bedrooms >= 0 AND bathrooms >= 0 AND "areaSquareMeters" > 0),
  ADD CONSTRAINT property_coordinates CHECK (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180),
  ADD CONSTRAINT property_public_coordinates CHECK (
    ("publicLatitude" IS NULL AND "publicLongitude" IS NULL)
    OR ("publicLatitude" IS NOT NULL AND "publicLongitude" IS NOT NULL
        AND "publicLatitude" BETWEEN -90 AND 90 AND "publicLongitude" BETWEEN -180 AND 180)
  );

ALTER TABLE "BrokerageListing" ADD CONSTRAINT listing_price CHECK ("priceMinor" >= 0);
ALTER TABLE "PropertyOwner" ADD CONSTRAINT ownership_share CHECK ("ownershipBasisPoints" BETWEEN 1 AND 10000);

-- Serialize ownership edits on the physical property before checking aggregate shares.
CREATE FUNCTION validate_ownership_total() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM "Property" WHERE id = NEW."propertyId" FOR UPDATE;
  IF (SELECT COALESCE(SUM("ownershipBasisPoints"), 0) FROM "PropertyOwner"
      WHERE "propertyId" = NEW."propertyId" AND "ownerId" <> NEW."ownerId")
      + NEW."ownershipBasisPoints" > 10000 THEN
    RAISE EXCEPTION 'Ownership shares exceed 100 percent' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER property_ownership_total BEFORE INSERT OR UPDATE ON "PropertyOwner"
FOR EACH ROW EXECUTE FUNCTION validate_ownership_total();
