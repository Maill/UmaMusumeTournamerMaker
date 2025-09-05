using System.ComponentModel.DataAnnotations;
using UmaMusumeTournamentMaker.API.Domain.Enums;

namespace UmaMusumeTournamentMaker.API.Application.DTOs
{
    public record TournamentDto
    {
        [Required]
        public int Id { get; init; }

        [Required]
        public string Name { get; init; } = string.Empty;

        [Required]
        public TournamentType Type { get; init; }

        [Required]
        public TournamentStatus Status { get; init; }

        [Required]
        public DateTime CreatedAt { get; init; }

        [Required]
        public DateTime? StartedAt { get; init; }

        [Required]
        public DateTime? CompletedAt { get; init; }

        [Required]
        public int CurrentRound { get; init; }

        [Required]
        public int? WinnerId { get; init; }

        public List<PlayerDto> Players { get; init; } = new();
        
        public List<RoundDto> Rounds { get; init; } = new();
    }
}