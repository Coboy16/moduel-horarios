"use client"

import { useContext } from "react"
import { UIContext } from "../context/UIContext"

export function useUI() {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error("useUI must be used within a UIProvider")
  }
  return context
}
