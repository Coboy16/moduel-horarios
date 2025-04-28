"use client";

import { useState } from "react";
import { useUI } from "../../hooks/useUI";
import { useMarkings } from "../../hooks/useMarkings";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { X, Check, Clock, User } from "lucide-react";
import { formatDate, formatTime } from "../../utils/dateUtils";

export default function FloatingTimeApprovalPanel() {
  const { closeFloatingTimePanel } = useUI();
  const { floatingTimeRequests, approveFloatingTime, rejectFloatingTime } =
    useMarkings();
  const [activeTab, setActiveTab] = useState("pending");

  const pendingRequests = floatingTimeRequests.filter(
    (req) => req.status === "pending"
  );
  const approvedRequests = floatingTimeRequests.filter(
    (req) => req.status === "approved"
  );
  const rejectedRequests = floatingTimeRequests.filter(
    (req) => req.status === "rejected"
  );

  return (
    <Card className="fixed bottom-4 right-4 w-[400px] shadow-lg z-40">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Tiempo Flotante</CardTitle>
          <Button variant="ghost" size="icon" onClick={closeFloatingTimePanel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>Solicitudes de tiempo flotante</CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              Pendientes
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex-1">
              Aprobadas
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-1">
              Rechazadas
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="pt-4 max-h-[400px] overflow-y-auto">
          <TabsContent value="pending" className="space-y-4 mt-0">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-md p-3 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{request.employeeName}</div>
                    <Badge variant="outline">{request.hours} horas</Badge>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-3 w-3 mr-1" />
                    <span>{request.department}</span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {formatDate(new Date(request.date), "short")} •
                      {formatTime(
                        new Date(request.date).getHours(),
                        new Date(request.date).getMinutes()
                      )}
                    </span>
                  </div>

                  {request.reason && (
                    <div className="text-sm">
                      <span className="font-medium">Motivo:</span>{" "}
                      {request.reason}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rejectFloatingTime(request.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Rechazar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approveFloatingTime(request.id)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Aprobar
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No hay solicitudes pendientes
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-0">
            {approvedRequests.length > 0 ? (
              approvedRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-md p-3 space-y-2 border-green-200 bg-green-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{request.employeeName}</div>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      {request.hours} horas
                    </Badge>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-3 w-3 mr-1" />
                    <span>{request.department}</span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {formatDate(new Date(request.date), "short")} •
                      {formatTime(
                        new Date(request.date).getHours(),
                        new Date(request.date).getMinutes()
                      )}
                    </span>
                  </div>

                  {request.reason && (
                    <div className="text-sm">
                      <span className="font-medium">Motivo:</span>{" "}
                      {request.reason}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No hay solicitudes aprobadas
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 mt-0">
            {rejectedRequests.length > 0 ? (
              rejectedRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-md p-3 space-y-2 border-red-200 bg-red-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{request.employeeName}</div>
                    <Badge
                      variant="outline"
                      className="bg-red-100 text-red-800 border-red-200"
                    >
                      {request.hours} horas
                    </Badge>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="h-3 w-3 mr-1" />
                    <span>{request.department}</span>
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {formatDate(new Date(request.date), "short")} •
                      {formatTime(
                        new Date(request.date).getHours(),
                        new Date(request.date).getMinutes()
                      )}
                    </span>
                  </div>

                  {request.reason && (
                    <div className="text-sm">
                      <span className="font-medium">Motivo:</span>{" "}
                      {request.reason}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No hay solicitudes rechazadas
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>

      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          Total: {floatingTimeRequests.length} solicitudes
        </div>
        <Button variant="outline" size="sm" onClick={closeFloatingTimePanel}>
          Cerrar
        </Button>
      </CardFooter>
    </Card>
  );
}
