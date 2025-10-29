import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Staff, Unit, InsertStaff, InsertUnit } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, UserPlus, Users, MapPin, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StaffManagementModal({ isOpen, onClose }: StaffManagementModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("staff");
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "staff" | "unit"; id: number } | null>(null);
  const [selectedStaffForAssignment, setSelectedStaffForAssignment] = useState<number | null>(null);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkUnitsText, setBulkUnitsText] = useState("");

  // Queries
  const { data: staffList = [], isLoading: loadingStaff } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
    enabled: isOpen,
  });

  const { data: unitsList = [], isLoading: loadingUnits } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
    enabled: isOpen,
  });

  const { data: staffUnits = [] } = useQuery<Unit[]>({
    queryKey: ["/api/staff", selectedStaffForAssignment, "units"],
    queryFn: async () => {
      if (!selectedStaffForAssignment) return [];
      const response = await fetch(`/api/staff/${selectedStaffForAssignment}/units`);
      if (!response.ok) throw new Error("Failed to fetch staff units");
      return response.json();
    },
    enabled: isOpen && selectedStaffForAssignment !== null,
  });

  // Mutations
  const createStaffMutation = useMutation({
    mutationFn: async (data: InsertStaff) => {
      const response = await apiRequest("POST", "/api/staff", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Thành công", description: "Đã thêm cán bộ mới" });
      setEditingStaff(null);
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể thêm cán bộ", variant: "destructive" });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertStaff> }) => {
      const response = await apiRequest("PATCH", `/api/staff/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Thành công", description: "Đã cập nhật cán bộ" });
      setEditingStaff(null);
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể cập nhật cán bộ", variant: "destructive" });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/staff/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Thành công", description: "Đã xóa cán bộ" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể xóa cán bộ", variant: "destructive" });
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: async (data: InsertUnit) => {
      const response = await apiRequest("POST", "/api/units", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({ title: "Thành công", description: "Đã thêm địa bàn mới" });
      setEditingUnit(null);
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể thêm địa bàn", variant: "destructive" });
    },
  });

  const bulkCreateUnitsMutation = useMutation({
    mutationFn: async (unitNames: string[]) => {
      const response = await apiRequest("POST", "/api/units/bulk", { unitNames });
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({ 
        title: "Thành công", 
        description: `Đã tạo ${data.count} địa bàn mới` 
      });
      setBulkUnitsText("");
      setShowBulkImport(false);
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể tạo địa bàn", variant: "destructive" });
    },
  });

  const updateUnitMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertUnit> }) => {
      const response = await apiRequest("PATCH", `/api/units/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({ title: "Thành công", description: "Đã cập nhật địa bàn" });
      setEditingUnit(null);
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể cập nhật địa bàn", variant: "destructive" });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/units/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({ title: "Thành công", description: "Đã xóa địa bàn" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể xóa địa bàn", variant: "destructive" });
    },
  });

  const assignStaffToUnitMutation = useMutation({
    mutationFn: async ({ staffId, unitId }: { staffId: number; unitId: number }) => {
      const response = await apiRequest("POST", `/api/staff/${staffId}/units/${unitId}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", selectedStaffForAssignment, "units"] });
      toast({ title: "Thành công", description: "Đã gán địa bàn cho cán bộ" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể gán địa bàn", variant: "destructive" });
    },
  });

  const removeStaffFromUnitMutation = useMutation({
    mutationFn: async ({ staffId, unitId }: { staffId: number; unitId: number }) => {
      const response = await apiRequest("DELETE", `/api/staff/${staffId}/units/${unitId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff", selectedStaffForAssignment, "units"] });
      toast({ title: "Thành công", description: "Đã hủy phân công" });
    },
    onError: () => {
      toast({ title: "Lỗi", description: "Không thể hủy phân công", variant: "destructive" });
    },
  });

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "staff") {
      deleteStaffMutation.mutate(itemToDelete.id);
    } else {
      deleteUnitMutation.mutate(itemToDelete.id);
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleStaffSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertStaff = {
      name: formData.get("name") as string,
      phone: (formData.get("phone") as string) || null,
      username: (formData.get("username") as string) || null,
      password: (formData.get("password") as string) || null,
      active: true,
    };

    if (editingStaff && editingStaff.id) {
      updateStaffMutation.mutate({ id: editingStaff.id, data });
    } else {
      createStaffMutation.mutate(data);
    }
  };

  const handleUnitSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: InsertUnit = {
      name: formData.get("name") as string,
      code: (formData.get("code") as string) || "",
      parentUnitId: null,
    };

    if (editingUnit && editingUnit.id) {
      updateUnitMutation.mutate({ id: editingUnit.id, data });
    } else {
      createUnitMutation.mutate(data);
    }
  };

  const handleBulkImport = () => {
    const unitNames = bulkUnitsText
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (unitNames.length === 0) {
      toast({ title: "Lỗi", description: "Vui lòng nhập ít nhất một địa bàn", variant: "destructive" });
      return;
    }

    bulkCreateUnitsMutation.mutate(unitNames);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              Quản lý Cán bộ và Địa bàn
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="staff" data-testid="tab-staff">
                <Users className="w-4 h-4 mr-2" />
                Cán bộ
              </TabsTrigger>
              <TabsTrigger value="units" data-testid="tab-units">
                <MapPin className="w-4 h-4 mr-2" />
                Địa bàn
              </TabsTrigger>
              <TabsTrigger value="assignments" data-testid="tab-assignments">
                <UserPlus className="w-4 h-4 mr-2" />
                Phân công
              </TabsTrigger>
            </TabsList>

            {/* STAFF TAB */}
            <TabsContent value="staff" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Danh sách cán bộ</h3>
                <Button
                  onClick={() => setEditingStaff({ id: 0, name: "", phone: null, username: null, passwordHash: null, active: true })}
                  data-testid="button-add-staff"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm cán bộ
                </Button>
              </div>

              {loadingStaff ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {staffList.map((staff) => (
                    <Card key={staff.id} data-testid={`card-staff-${staff.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{staff.name}</CardTitle>
                            {staff.phone && (
                              <CardDescription className="text-sm">
                                SĐT: {staff.phone}
                              </CardDescription>
                            )}
                          </div>
                          <Badge variant={staff.active ? "default" : "secondary"}>
                            {staff.active ? "Hoạt động" : "Ngưng"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingStaff(staff)}
                          data-testid={`button-edit-staff-${staff.id}`}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setItemToDelete({ type: "staff", id: staff.id });
                            setDeleteConfirmOpen(true);
                          }}
                          data-testid={`button-delete-staff-${staff.id}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Xóa
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              {/* Staff Form */}
              {editingStaff && (
                <Card className="border-primary">
                  <form onSubmit={handleStaffSubmit}>
                    <CardHeader>
                      <CardTitle>
                        {editingStaff.id ? "Chỉnh sửa cán bộ" : "Thêm cán bộ mới"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="staff-name">Họ và tên *</Label>
                        <Input
                          id="staff-name"
                          name="name"
                          defaultValue={editingStaff.name}
                          required
                          data-testid="input-staff-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="staff-phone">Số điện thoại</Label>
                        <Input
                          id="staff-phone"
                          name="phone"
                          defaultValue={editingStaff.phone || ""}
                          placeholder="0123456789"
                          data-testid="input-staff-phone"
                        />
                      </div>
                      
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium mb-3">Thông tin đăng nhập</p>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="staff-username">Tên đăng nhập</Label>
                            <Input
                              id="staff-username"
                              name="username"
                              defaultValue={editingStaff.username || ""}
                              placeholder="Để trống nếu không cho phép đăng nhập"
                              data-testid="input-staff-username"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Tối thiểu 3 ký tự
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="staff-password">Mật khẩu {editingStaff.id ? "(để trống nếu không đổi)" : ""}</Label>
                            <Input
                              id="staff-password"
                              name="password"
                              type="password"
                              placeholder={editingStaff.id ? "Nhập mật khẩu mới nếu muốn đổi" : "Nhập mật khẩu"}
                              data-testid="input-staff-password"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Tối thiểu 6 ký tự
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button type="submit" data-testid="button-submit-staff">
                        {editingStaff.id ? "Cập nhật" : "Thêm"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingStaff(null)}
                        data-testid="button-cancel-staff"
                      >
                        Hủy
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              )}
            </TabsContent>

            {/* UNITS TAB */}
            <TabsContent value="units" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Danh sách địa bàn</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowBulkImport(!showBulkImport)}
                    data-testid="button-bulk-import"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Nhập nhiều
                  </Button>
                  <Button
                    onClick={() => setEditingUnit({ id: 0, name: "", code: "", parentUnitId: null })}
                    data-testid="button-add-unit"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm địa bàn
                  </Button>
                </div>
              </div>

              {/* Bulk Import Section */}
              {showBulkImport && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="text-base">Nhập nhiều địa bàn cùng lúc</CardTitle>
                    <CardDescription>
                      Nhập tên các địa bàn, mỗi dòng một địa bàn. Mã số sẽ được tự động tạo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={"UBND xã Đại Đồng\nUBND xã Phương Liễu\nUBND phường Đông Ngàn\n..."}
                      className="min-h-48"
                      value={bulkUnitsText}
                      onChange={(e) => setBulkUnitsText(e.target.value)}
                      data-testid="textarea-bulk-units"
                    />
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button 
                      onClick={handleBulkImport} 
                      disabled={bulkCreateUnitsMutation.isPending}
                      data-testid="button-submit-bulk"
                    >
                      {bulkCreateUnitsMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Tạo địa bàn
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowBulkImport(false);
                        setBulkUnitsText("");
                      }}
                      data-testid="button-cancel-bulk"
                    >
                      Hủy
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {loadingUnits ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unitsList.map((unit) => (
                    <Card key={unit.id} data-testid={`card-unit-${unit.id}`}>
                      <CardHeader>
                        <CardTitle className="text-base">{unit.name}</CardTitle>
                        {unit.code && (
                          <CardDescription className="text-sm">
                            Mã: {unit.code}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardFooter className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUnit(unit)}
                          data-testid={`button-edit-unit-${unit.id}`}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Sửa
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setItemToDelete({ type: "unit", id: unit.id });
                            setDeleteConfirmOpen(true);
                          }}
                          data-testid={`button-delete-unit-${unit.id}`}
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Xóa
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              {/* Unit Form */}
              {editingUnit && (
                <Card className="border-primary">
                  <form onSubmit={handleUnitSubmit}>
                    <CardHeader>
                      <CardTitle>
                        {editingUnit.id ? "Chỉnh sửa địa bàn" : "Thêm địa bàn mới"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="unit-name">Tên địa bàn *</Label>
                        <Input
                          id="unit-name"
                          name="name"
                          defaultValue={editingUnit.name}
                          required
                          placeholder="VD: UBND xã Đại Đồng"
                          data-testid="input-unit-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit-code">Mã địa bàn</Label>
                        <Input
                          id="unit-code"
                          name="code"
                          defaultValue={editingUnit.code || ""}
                          placeholder="VD: DD01"
                          data-testid="input-unit-code"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button type="submit" data-testid="button-submit-unit">
                        {editingUnit.id ? "Cập nhật" : "Thêm"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingUnit(null)}
                        data-testid="button-cancel-unit"
                      >
                        Hủy
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              )}
            </TabsContent>

            {/* ASSIGNMENTS TAB */}
            <TabsContent value="assignments" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Phân công địa bàn cho cán bộ</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="select-staff">Chọn cán bộ</Label>
                    <Select
                      value={selectedStaffForAssignment?.toString()}
                      onValueChange={(value) => setSelectedStaffForAssignment(parseInt(value))}
                    >
                      <SelectTrigger data-testid="select-staff">
                        <SelectValue placeholder="Chọn cán bộ..." />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.filter(s => s.active).map((staff) => (
                          <SelectItem key={staff.id} value={staff.id.toString()}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedStaffForAssignment && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Địa bàn đã phân công</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {staffUnits.map((unit) => (
                            <Badge key={unit.id} variant="secondary" className="gap-2">
                              {unit.name}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() =>
                                  removeStaffFromUnitMutation.mutate({
                                    staffId: selectedStaffForAssignment,
                                    unitId: unit.id,
                                  })
                                }
                                data-testid={`button-remove-unit-${unit.id}`}
                              >
                                ×
                              </Button>
                            </Badge>
                          ))}
                          {staffUnits.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                              Chưa có địa bàn nào được phân công
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {selectedStaffForAssignment && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Gán địa bàn mới</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {unitsList
                            .filter((unit) => !staffUnits.find((su) => su.id === unit.id))
                            .map((unit) => (
                              <Button
                                key={unit.id}
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  assignStaffToUnitMutation.mutate({
                                    staffId: selectedStaffForAssignment,
                                    unitId: unit.id,
                                  })
                                }
                                data-testid={`button-assign-unit-${unit.id}`}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                {unit.name}
                              </Button>
                            ))}
                        </div>
                        {unitsList.filter((unit) => !staffUnits.find((su) => su.id === unit.id)).length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            Tất cả địa bàn đã được gán
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa {itemToDelete?.type === "staff" ? "cán bộ" : "địa bàn"} này?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} data-testid="button-confirm-delete">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
