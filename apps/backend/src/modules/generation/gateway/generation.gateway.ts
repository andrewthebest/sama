import { Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GenerationProgressEvent } from "@sama-emi/contracts";

/**
 * Passerelle WebSocket du module `generation`.
 *
 * Namespace dédié `/generation` pour ne pas mélanger ce trafic avec le
 * futur centre de notifications transverse (module `notifications`,
 * Lot 8), qui utilisera vraisemblablement son propre namespace.
 *
 * Protocole minimal : le client rejoint la room `job:{jobId}` après
 * avoir reçu son `jobId` en réponse à `POST /generations`, puis reçoit
 * les événements `progress` diffusés par `GenerationService` au fil de
 * la simulation (Session A) ou de l'appel réel à Claude (Session B).
 */
@WebSocketGateway({
  namespace: "/generation",
  cors: { origin: true, credentials: true },
})
export class GenerationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GenerationGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connecté : ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client déconnecté : ${client.id}`);
  }

  @SubscribeMessage("join")
  handleJoin(@MessageBody() jobId: string, @ConnectedSocket() client: Socket): void {
    void client.join(this.nomRoom(jobId));
  }

  /** Diffuse un événement de progression à tous les clients abonnés à ce job. */
  emettreProgression(event: GenerationProgressEvent): void {
    this.server.to(this.nomRoom(event.jobId)).emit("progress", event);
  }

  private nomRoom(jobId: string): string {
    return `job:${jobId}`;
  }
}
