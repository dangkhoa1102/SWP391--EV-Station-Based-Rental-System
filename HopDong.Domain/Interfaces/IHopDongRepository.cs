using HopDong.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HopDong.Domain.Interfaces;

public interface IHopDongRepository
{
    Task AddAsync(HopDongThueXe hopDong);
    Task<HopDongThueXe?> GetByIdAsync(Guid id);
    Task<HopDongThueXe?> GetByTokenAsync(string token); // M?i
    Task UpdateAsync(HopDongThueXe hopDong); // M?i
}