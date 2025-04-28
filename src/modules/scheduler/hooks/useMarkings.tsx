"use client"

import { useContext } from "react"
import { MarkingContext } from "../context/MarkingContext"

export function useMarkings() {
  const context = useContext(MarkingContext)
  if (!context) {
    throw new Error("useMarkings must be used within a MarkingProvider")
  }
  return context
}
