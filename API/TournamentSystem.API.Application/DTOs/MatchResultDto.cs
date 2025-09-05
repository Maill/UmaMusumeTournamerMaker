using System.ComponentModel.DataAnnotations;

namespace UmaMusumeTournamentMaker.API.Application.DTOs
{
    /// <summary>
    /// DTO for individual match result
    /// </summary>
    public record MatchResultDto
    {
        /// <summary>
        /// Match ID
        /// </summary>
        [Required]
        public int MatchId { get; init; }

        /// <summary>
        /// Winner Player ID
        /// </summary>
        [Required]
        public int WinnerId { get; init; }
    }
}
